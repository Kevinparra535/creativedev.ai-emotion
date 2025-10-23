import config from '@/config/config';
import { localHeuristic, promptToService, tryParseEmotion } from '@/utils/iaUtiils';

// Example of response from the model
// {
//   "label": "joy",
//   "score": 0.8,
//   "valence": 0.7,
//   "arousal": 0.6,
//   "colors": ["#FFD700", "#FFB300"],
//   "intensity": 0.7,
//   "relations": ["nostalgia", "gratitude", "love", "curiosity", "hope"]
// }

export type EmotionResponse = {
  label: string;
  score: number;
  valence: number; // positivo (+), negativo (-)
  arousal: number; // energía: calma (0) → intensa (1)
  colors: string[]; // paleta sugerida por la IA
  intensity: number; // 0–1 para brillo/energía visual
  relations: string[]; // emociones relacionadas y su fuerza
};

export async function analyzeText(text: string): Promise<EmotionResponse> {
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
        messages: [promptToService(), { role: 'user', content: text }],
        temperature: 0.2
      })
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    console.log('[openIAService] analyzeText response:', content);
    const parsed = tryParseEmotion(content);
    return parsed ?? localHeuristic(text);
  } catch (err) {
    console.error('[openIAService] analyzeText falling back to heuristic', err);
    return localHeuristic(text);
  }
}
