import config from '@/config/config';
import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import type { Galaxy } from '@/domain/galaxy';
import { GraphBuilder } from '@/systems/GraphBuilder';
import { clusterByPrimaries } from '@/systems/ClusterEngine';
import { RuleEngine } from '@/systems/RuleEngine';
import { EnergyRules } from '@/systems/rules/EnergyRules';
import { mapAIToDomain } from '@/data/mappers';
import { buildPayloadFromText, localHeuristic } from '@/ai/local-emotions';
import { OpenIAAdapter } from '@/services/OpenIAAdapter';
import { clusterKeyForLabel } from '@/config/emotion-clusters';

type EmotionGraphResult = Promise<{ emotions: Emotion[]; links: Link[]; galaxies: Galaxy[] }>;

export interface EmotionService {
  analyze(text: string): Promise<Emotion>;
  analyzeMulti(text: string): Promise<{ emotions: Emotion[]; links: Link[] }>;
  analyzeToGraph(text: string): EmotionGraphResult;
}

function toDomainFromLocal(heuristic: ReturnType<typeof localHeuristic>): Emotion {
  const colors = heuristic.colors && heuristic.colors.length ? heuristic.colors : undefined;
  return {
    id: `${heuristic.label}-0`,
    label: heuristic.label,
    valence: heuristic.valence,
    arousal: heuristic.arousal,
    intensity: heuristic.intensity,
    colorHex: colors?.[0],
    meta: { score: heuristic.score, colors, relations: heuristic.relations }
  };
}

const LocalEmotionService: EmotionService = {
  async analyze(text: string) {
    const h = localHeuristic(text);
    return toDomainFromLocal(h);
  },
  async analyzeMulti(text: string) {
    const multi = buildPayloadFromText(text);
    const payload = {
      nodes: multi.emotions.map((e) => ({
        label: e.label,
        score: e.weight,
        valence: e.valence,
        arousal: e.arousal,
        intensity: e.intensity,
        colors: e.colors,
        relations: e.relations
      })),
      edges: (multi.pairs ?? []).map(([a, b]) => ({
        source: a,
        target: b,
        kind: 'cooccurrence',
        weight: 0.5
      }))
    };
    return mapAIToDomain(payload);
  },
  async analyzeToGraph(text: string) {
    const { emotions, links } = await this.analyzeMulti(text);
    const rules = config.ENABLE_ENERGY_LINKS ? EnergyRules : [];
    const ruleLinks = new RuleEngine({ id: 'energies', rules }).apply(emotions);
    let merged = GraphBuilder.mergeLinks(...links, ...ruleLinks);
    // Re-balance: if there are links but none are cross-cluster, synthesize 1–2 cross-cluster links
    if (merged.length > 0) {
  const byId = new Map(emotions.map((e) => [e.id, e] as const));
      const cross = merged.filter((l) => {
        const a = byId.get(l.source);
        const b = byId.get(l.target);
        if (!a || !b) return false;
        const ka = clusterKeyForLabel(a.label);
        const kb = clusterKeyForLabel(b.label);
        return !!ka && !!kb && ka !== kb;
      }).length;
      if (cross === 0 && emotions.length > 1) {
        const scoreOf = (e: Emotion): number => {
          if (typeof e.intensity === 'number') return e.intensity;
          const ms = (e.meta as { score?: number } | undefined)?.score;
          return typeof ms === 'number' ? ms : 0.5;
        };
        const sorted = [...emotions].sort((a, b) => scoreOf(b) - scoreOf(a));
        let added = false;
        for (let i = 0; i < Math.min(3, sorted.length) && !added; i++) {
          for (let j = i + 1; j < Math.min(4, sorted.length); j++) {
            const a = sorted[i];
            const b = sorted[j];
            const ka = clusterKeyForLabel(a.label);
            const kb = clusterKeyForLabel(b.label);
            if (!ka || !kb || ka === kb) continue;
            merged.push({
              id: `rebalance|${a.id}->${b.id}`,
              source: a.id,
              target: b.id,
              kind: 'semantic',
              weight: Math.min(0.85, 0.38 + ((a.intensity ?? 0.6) + (b.intensity ?? 0.6)) * 0.28)
            });
            added = true;
            break;
          }
        }
      }
    }
    // Prefer primary emotion galaxies (love/joy/fear/...) over coarse valence buckets
    const galaxies = clusterByPrimaries(emotions);
    return { emotions, links: merged, galaxies };
  }
};

function shouldUseOnline(): boolean {
  if (config.EMOTION_MODE === 'online') return true;
  if (config.EMOTION_MODE === 'offline') return false;
  // auto
  return !!config.OPENAI_API_KEY;
}

export function getEmotionService(): EmotionService {
  return shouldUseOnline() ? OpenIAAdapter : LocalEmotionService;
}

// Convenience default instance
export const emotionService: EmotionService = getEmotionService();
