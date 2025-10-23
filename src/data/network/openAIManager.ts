import 'reflect-metadata';
import { injectable } from 'inversify';
import type { Emotion } from '@/domain/entities/emotion';
import type { OpenAIRepository } from '@/domain/repositories/openAIRepository';

type AnalyzeOptions = { signal?: AbortSignal };

@injectable()
export class OpenAIManager implements OpenAIRepository {
  private readonly apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  private readonly baseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

  async analyzeText(text: string, options?: AnalyzeOptions): Promise<Emotion> {
    // Safety: fallback heuristic if no API key configured
    if (!this.apiKey) {
      return this.localHeuristic(text);
    }

    try {
      // Example: call a classification endpoint or prompt a model; placeholder body
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: options?.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          // Adjust model if configured via env
          model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Eres un clasificador de emoción. Devuelve JSON: {label, score, valence(-1..1), arousal(0..1)}'
            },
            { role: 'user', content: text }
          ],
          temperature: 0.2
        })
      });

      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      // TODO: parse model response robustly; for now, try to extract JSON block
      const content: string = data.choices?.[0]?.message?.content ?? '';
      const parsed = this.tryParseEmotion(content) ?? this.localHeuristic(text);
      return parsed;
    } catch (err) {
      // Network/abort/rate limit → fallback heuristic to keep UX responsive
      // eslint-disable-next-line no-console
      console.warn('[OpenAIManager] analyzeText falling back to heuristic:', err);
      return this.localHeuristic(text);
    }
  }

  private tryParseEmotion(s: string): Emotion | null {
    try {
      const match = /\{[\s\S]*\}/.exec(s);
      const json = match ? match[0] : null;
      if (!json) return null;
      const obj = JSON.parse(json) as Partial<Emotion>;
      if (!obj.label) return null;
      return {
        label: String(obj.label),
        score: typeof obj.score === 'number' ? obj.score : 1,
        valence: typeof obj.valence === 'number' ? obj.valence : 0,
        arousal: typeof obj.arousal === 'number' ? obj.arousal : 0.5
      };
    } catch {
      return null;
    }
  }

  private localHeuristic(text: string): Emotion {
    const t = text.toLowerCase();
    if (!t.trim()) return { label: 'neutral', score: 1, valence: 0, arousal: 0.2 };
    const joy = /(feliz|alegr|gracias|amor|content|😊|😀)/.test(t);
    const fear = /(miedo|ansied|nerv|preocup|😰|😱)/.test(t);
    const nostalgia = /(recuerdo|nostal|extraño|añoro|melanc)/.test(t);
    if (joy) return { label: 'joy', score: 0.9, valence: 0.7, arousal: 0.6 };
    if (fear) return { label: 'fear', score: 0.85, valence: -0.6, arousal: 0.7 };
    if (nostalgia) return { label: 'nostalgia', score: 0.8, valence: -0.1, arousal: 0.3 };
    return { label: 'neutral', score: 0.6, valence: 0, arousal: 0.3 };
  }
}
