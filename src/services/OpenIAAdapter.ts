import config from '@/config/config';
import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import { GraphBuilder } from '@/systems/GraphBuilder';
import { RuleEngine } from '@/systems/RuleEngine';
import { mapAIToDomain } from '@/data/mappers';
import { promptToService, promptToUser, tryParseEmotion, tryParseMulti } from '@/utils/iaUtiils';
import { PayloadZ } from '@/utils/validators';
import type { z } from 'zod';
import { expandFromDominant, localHeuristic } from '@/ai/local-emotions';

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
    const galaxies = GraphBuilder.clusterByValence(emotions);
    return { emotions, links: merged, galaxies };
  }
};
