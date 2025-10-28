import type { z } from 'zod';

import config from '@/config/config';
import { clusterKeyForLabel } from '@/config/emotion-clusters';

import { expandFromDominant, localHeuristic } from '@/ai/local-emotions';
import { mapAIToDomain } from '@/data/mappers';
import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import { GraphBuilder } from '@/systems/GraphBuilder';
import { RuleEngine } from '@/systems/RuleEngine';
import { promptToService, promptToUser, tryParseEmotion, tryParseMulti } from '@/utils/iaUtiils';
import { PayloadZ } from '@/utils/validators';

function tryParseZodPayload(content: string): z.infer<typeof PayloadZ> | null {
  try {
    const match = /\{[\s\S]*\}/.exec(content);
    const json = match ? match[0] : null;
    if (!json) return null;
    const raw = JSON.parse(json);
    const parsed = PayloadZ.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

type LooseEmotion = {
  label?: unknown;
  valence?: unknown;
  arousal?: unknown;
  intensity?: unknown;
  colors?: unknown;
  relations?: unknown;
  score?: unknown;
};

function toDomainEmotion(src: LooseEmotion): Emotion {
  const label = typeof src.label === 'string' ? src.label : 'neutral';
  const valence = typeof src.valence === 'number' ? src.valence : 0;
  const arousal = typeof src.arousal === 'number' ? src.arousal : 0.5;
  const intensity = typeof src.intensity === 'number' ? src.intensity : undefined;
  const colors: string[] | undefined = Array.isArray(src.colors)
    ? (src.colors as unknown[]).filter((c) => typeof c === 'string')
    : undefined;
  const relations: string[] | undefined = Array.isArray(src.relations)
    ? (src.relations as unknown[]).filter((r) => typeof r === 'string')
    : undefined;
  const score = typeof src.score === 'number' ? src.score : undefined;
  return {
    id: `${label}-0`,
    label,
    valence,
    arousal,
    intensity,
    colorHex: colors?.[0],
    meta: { score, colors, relations }
  };
}

// Responde expected
// {
//   "label": "joy",
//   "score": 0.8,
//   "valence": 0.7,
//   "arousal": 0.6,
//   "colors": ["#FFD700", "#FF4500"],
//   "intensity": 0.7,
//   "relations": ["nostalgia", "gratitude", "love", "surprise", "calm"]
// }

export const OpenIAAdapter = {
  async analyze(text: string): Promise<Emotion> {
    // Preserve current behavior: fallback to heuristic when no key
    if (!config.OPENAI_API_KEY) return toDomainEmotion(localHeuristic(text));

    try {
      const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: config.OPENAI_MODEL,
          messages: [promptToService(), promptToUser(text)],
          temperature: 0.2
        })
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? '';
      console.log('[OpenIAAdapter] analyze response content:', content);
      const parsed = tryParseEmotion(content);
      return toDomainEmotion(parsed ?? localHeuristic(text));
    } catch (err) {
      console.error('[OpenIAAdapter] analyze fallback to heuristic', err);
      return toDomainEmotion(localHeuristic(text));
    }
  },

  async analyzeMulti(text: string): Promise<{ emotions: Emotion[]; links: Link[] }> {
    // If no key, build a multi from heuristic dominant
    if (!config.OPENAI_API_KEY) {
      const dominant = localHeuristic(text);
      const multi = expandFromDominant(dominant);
      const payload = {
        nodes: multi.emotions.map((e) => ({
          label: e.label,
          score: e.weight,
          valence: e.valence,
          arousal: e.arousal,
          intensity: e.intensity
        })),
        edges: (multi.pairs ?? []).map(([a, b]) => ({
          source: a,
          target: b,
          kind: 'cooccurrence',
          weight: 0.5
        }))
      };
      return mapAIToDomain(payload);
    }

    try {
      const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: config.OPENAI_MODEL,
          messages: [promptToService(), promptToUser(text)],
          temperature: 0.2
        })
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? '';
      // Strict validation first (Zod)
      const validated = tryParseZodPayload(content);
      console.log('[OpenIAAdapter] analyzeMulti response content:', content);
      if (validated) {
        const payload = {
          nodes: validated.emotions.map((e) => ({
            id: e.id,
            label: e.label,
            score: e.weight,
            valence: e.valence,
            arousal: e.arousal,
            intensity: e.intensity,
            colors: e.colors,
            relations: e.relations
          })),
          edges: (validated.pairs ?? []).map(([a, b]) => ({
            source: a,
            target: b,
            kind: 'cooccurrence',
            weight: 0.6
          }))
        };
        return mapAIToDomain(payload);
      }

      // Permissive parser fallback
      const parsed = tryParseMulti(content);
      if (parsed) {
        const payload = {
          nodes: parsed.emotions.map((e) => ({
            id: e.id,
            label: e.label,
            score: e.weight,
            valence: e.valence,
            arousal: e.arousal,
            intensity: e.intensity,
            relations: e.relations
          })),
          edges: (parsed.pairs ?? []).map(([a, b]) => ({
            source: a,
            target: b,
            kind: 'cooccurrence',
            weight: 0.6
          }))
        };
        return mapAIToDomain(payload);
      }
      // Fallback to heuristic-based multi
      const dominant = localHeuristic(text);
      const multi = expandFromDominant(dominant);

      const payload = {
        nodes: multi.emotions.map((e) => ({
          label: e.label,
          score: e.weight,
          valence: e.valence,
          arousal: e.arousal,
          intensity: e.intensity
        })),
        edges: (multi.pairs ?? []).map(([a, b]) => ({
          source: a,
          target: b,
          kind: 'cooccurrence',
          weight: 0.5
        }))
      };
      return mapAIToDomain(payload);
    } catch (err) {
      console.error('[OpenIAAdapter] analyzeMulti fallback to heuristic', err);
      const dominant = localHeuristic(text);
      const multi = expandFromDominant(dominant);
      const payload = {
        nodes: multi.emotions.map((e) => ({
          label: e.label,
          score: e.weight,
          valence: e.valence,
          arousal: e.arousal,
          intensity: e.intensity
        })),
        edges: (multi.pairs ?? []).map(([a, b]) => ({
          source: a,
          target: b,
          kind: 'cooccurrence',
          weight: 0.5
        }))
      };
      return mapAIToDomain(payload);
    }
  },

  async analyzeToGraph(text: string) {
    const { emotions, links } = await this.analyzeMulti(text);
    // Apply rules if needed (empty ruleset placeholder for now)
    const ruleLinks = new RuleEngine({ id: 'base', rules: [] }).apply(emotions);
  const merged = GraphBuilder.mergeLinks(...links, ...ruleLinks);
  // Fallback: if no links provided by the model, synthesize 1–2 cross-cluster links
    if (!merged.length && emotions.length > 1) {
      type MetaMaybeScore = { score?: number };
      const scoreOf = (e: Emotion): number => {
        if (typeof e.intensity === 'number') return e.intensity;
        const m = e.meta as MetaMaybeScore | undefined;
        const s = typeof m?.score === 'number' ? m.score : undefined;
        return typeof s === 'number' ? s : 0.5;
      };

      const sorted = [...emotions].sort((a, b) => scoreOf(b) - scoreOf(a));
      // try top 3 emotions to find cross-cluster combinations
      for (let i = 0; i < Math.min(3, sorted.length); i++) {
        for (let j = i + 1; j < Math.min(4, sorted.length); j++) {
          const a = sorted[i];
          const b = sorted[j];
          const ka = clusterKeyForLabel(a.label);
          const kb = clusterKeyForLabel(b.label);
          if (!ka || !kb || ka === kb) continue;
          merged.push({
            id: `inf|${a.id}->${b.id}`,
            source: a.id,
            target: b.id,
            kind: 'semantic',
            weight: Math.min(0.9, 0.4 + ((a.intensity ?? 0.6) + (b.intensity ?? 0.6)) * 0.3)
          });
        }
        if (merged.length > 0) break;
      }
    }
    // Re-balance: links exist but none are cross-cluster → synthesize one
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
        type MetaMaybeScore = { score?: number };
        const scoreOf = (e: Emotion): number => {
          if (typeof e.intensity === 'number') return e.intensity;
          const m = e.meta as MetaMaybeScore | undefined;
          return typeof m?.score === 'number' ? m.score : 0.5;
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
    const galaxies = GraphBuilder.clusterByValence(emotions);
    return { emotions, links: merged, galaxies };
  }
};
