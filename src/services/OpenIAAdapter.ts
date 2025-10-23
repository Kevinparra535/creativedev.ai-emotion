import config from '@/config/config';
import type { EmotionResponse, MultiEmotionResult } from '@/domain/emotion';
import { localHeuristic, promptToService, promptToUser, tryParseEmotion, tryParseMulti } from '@/utils/iaUtiils';

export const OpenIAAdapter = {
  async analyze(text: string): Promise<EmotionResponse> {
    // Preserve current behavior: fallback to heuristic when no key
    if (!config.OPENAI_API_KEY) return localHeuristic(text);
    try {
      const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: config.OPENAI_MODEL, messages: [promptToService(), promptToUser(text)], temperature: 0.2 })
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
  },

  async analyzeMulti(text: string): Promise<MultiEmotionResult | null> {
    if (!config.OPENAI_API_KEY) return null;
    try {
      const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: config.OPENAI_MODEL, messages: [promptToService(), promptToUser(text)], temperature: 0.2 })
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? '';
      return tryParseMulti(content);
    } catch (err) {
      console.error('[OpenIAAdapter] analyzeMulti error', err);
      return null;
    }
  }
};
