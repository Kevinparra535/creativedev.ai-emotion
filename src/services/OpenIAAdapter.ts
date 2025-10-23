import config from '@/config/config';
import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import { GraphBuilder } from '@/systems/GraphBuilder';
import { RuleEngine } from '@/systems/RuleEngine';
import { mapAIToDomain } from '@/data/mappers';
import { promptToService, promptToUser, tryParseEmotion, tryParseMulti } from '@/utils/iaUtiils';
import { PayloadZ } from '@/utils/validators';
import { expandFromDominant, localHeuristic } from '@/config/local-emotions';

function tryParseZodPayload(content: string) {
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
    if (!config.OPENAI_API_KEY) return localHeuristic(text);
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
      console.log('[OpenIAAdapter] analyze response:', content);
      const parsed = tryParseEmotion(content);
      return parsed ?? localHeuristic(text);
    } catch (err) {
      console.error('[OpenIAAdapter] analyze fallback to heuristic', err);
      return localHeuristic(text);
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
      console.log('[OpenIAAdapter] analyzeMulti response:', content);
      // Strict validation first (Zod)
      const validated = tryParseZodPayload(content);
      if (validated) {
        const payload = {
          nodes: validated.emotions.map((e) => ({
            label: e.label,
            score: e.weight,
            valence: e.valence,
            arousal: e.arousal,
            intensity: e.intensity,
            colors: e.colors
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
            label: e.label,
            score: e.weight,
            valence: e.valence,
            arousal: e.arousal,
            intensity: e.intensity
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
