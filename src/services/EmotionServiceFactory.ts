import config from '@/config/config';
import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import type { Galaxy } from '@/domain/galaxy';
import { GraphBuilder } from '@/systems/GraphBuilder';
import { clusterByPrimaries } from '@/systems/ClusterEngine';
import { RuleEngine } from '@/systems/RuleEngine';
import { mapAIToDomain } from '@/data/mappers';
import { buildPayloadFromText, localHeuristic } from '@/ai/local-emotions';
import { OpenIAAdapter } from '@/services/OpenIAAdapter';

export interface EmotionService {
  analyze(text: string): Promise<Emotion>;
  analyzeMulti(text: string): Promise<{ emotions: Emotion[]; links: Link[] }>;
  analyzeToGraph(
    text: string
  ): Promise<{ emotions: Emotion[]; links: Link[]; galaxies: Galaxy[] }>;
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
        colors: e.colors
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
    const ruleLinks = new RuleEngine({ id: 'base', rules: [] }).apply(emotions);
    const merged = GraphBuilder.mergeLinks(...links, ...ruleLinks);
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
