import config from '@/config/config';
import type { Emotion } from '@/domain/emotion';
import { localHeuristic, promptToService, promptToUser, tryParseEmotion } from '@/utils/iaUtiils';

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
      const parsed = tryParseEmotion(content);
      return parsed ?? localHeuristic(text);
    } catch (err) {
      console.error('[OpenIAAdapter] analyze fallback to heuristic', err);
      return localHeuristic(text);
    }
  }
};
