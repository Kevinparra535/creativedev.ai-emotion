import config from '@/config/config';

export type EmotionResponse = {
  label: string;
  score: number;
  valence: number; // -1..1
  arousal: number; // 0..1
};

type AnalyzeOptions = { signal?: AbortSignal };

export async function analyzeText(
  text: string,
  options?: AnalyzeOptions
): Promise<EmotionResponse> {
  if (!config.OPENAI_API_KEY) return localHeuristic(text);

  try {
    const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: options?.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL,
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
    const content: string = data.choices?.[0]?.message?.content ?? '';
    console.log('OpenAI response data:', content);
    return tryParseEmotion(content) ?? localHeuristic(text);
  } catch {
    console.error('[openIAService] analyzeText falling back to heuristic');
    return localHeuristic(text);
  }
}

function tryParseEmotion(s: string): EmotionResponse | null {
  try {
    const match = /\{[\s\S]*\}/.exec(s);
    const json = match ? match[0] : null;
    if (!json) return null;
    const obj = JSON.parse(json) as Partial<EmotionResponse>;
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

function localHeuristic(text: string): EmotionResponse {
  const t = text.toLowerCase();
  if (!t.trim()) return { label: 'neutral', score: 1, valence: 0, arousal: 0.2 };
  const joy = /(feliz|felicidad|alegr|gracias|amor|content|😊|😀)/.test(t);
  const fear = /(miedo|ansied|nerv|preocup|😰|😱)/.test(t);
  const nostalgia = /(recuerdo|nostal|extraño|añoro|melanc)/.test(t);
  const anger = /(enojo|enojad|ira|rabia|furia|😡)/.test(t);
  const sadness = /(triste|deprim|lloro|pena|😢)/.test(t);
  const calm = /(calma|tranquil|paz|relajad|seren)/.test(t);

  if (joy) return { label: 'joy', score: 0.9, valence: 0.7, arousal: 0.6 };
  if (calm) return { label: 'calm', score: 0.85, valence: 0.3, arousal: 0.25 };
  if (sadness) return { label: 'sadness', score: 0.85, valence: -0.5, arousal: 0.3 };
  if (fear) return { label: 'fear', score: 0.85, valence: -0.6, arousal: 0.7 };
  if (anger) return { label: 'anger', score: 0.86, valence: -0.7, arousal: 0.75 };
  if (nostalgia) return { label: 'nostalgia', score: 0.8, valence: -0.1, arousal: 0.3 };
  return { label: 'neutral', score: 0.6, valence: 0, arousal: 0.3 };
}
