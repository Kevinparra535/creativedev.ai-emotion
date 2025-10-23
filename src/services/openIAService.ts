import config from '@/config/config';
import {
  localHeuristic,
  promptToService,
  promptToUser,
  tryParseEmotion,
  tryParseMulti,
  type MultiEmotionResult
} from '@/utils/iaUtiils';

// Example of response from the model
//  {
//   "emotions": [
//     {"label": "sadness", "weight": 0.75, "valence": 0.1, "arousal": 0.4, "colors": ["#2196F3"], "intensity": 0.8},
//     {"label": "loneliness", "weight": 0.7, "valence": 0.2, "arousal": 0.5, "colors": ["#3F51B5"], "intensity": 0.75},
//     {"label": "fear", "weight": 0.5, "valence": 0.3, "arousal": 0.6, "colors": ["#F44336"], "intensity": 0.6},
//     {"label": "nostalgia", "weight": 0.3, "valence": 0.4, "arousal": 0.3, "colors": ["#FF9800"], "intensity": 0.5},
//     {"label": "anxiety", "weight": 0.25, "valence": 0.2, "arousal": 0.7, "colors": ["#FF5722"], "intensity": 0.4},
//     {"label": "despair", "weight": 0.2, "valence": 0.1, "arousal": 0.5, "colors": ["#9C27B0"], "intensity": 0.3},
//     {"label": "emptiness", "weight": 0.15, "valence": 0.1, "arousal": 0.4, "colors": ["#E91E63"], "intensity": 0.2},
//     {"label": "hopelessness", "weight": 0.1, "valence": 0.05, "arousal": 0.3, "colors": ["#673AB7"], "intensity": 0.1}
//   ],
//   "global": {
//     "valence": 0.2,
//     "arousal": 0.45
//   },
//   "pairs": [
//     ["sadness", "loneliness"],
//     ["fear", "anxiety"],
//     ["nostalgia", "emptiness"]
//   ]
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
  return localHeuristic(text);
  // if (!config.OPENAI_API_KEY) return localHeuristic(text);

  // try {
  //   const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${config.OPENAI_API_KEY}`
  //     },
  //     body: JSON.stringify({
  //       model: config.OPENAI_MODEL,
  //       messages: [promptToService(), promptToUser(text)],
  //       temperature: 0.2
  //     })
  //   });
  //   if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  //   const data = await res.json();
  //   const content: string = data.choices?.[0]?.message?.content ?? '';
  //   console.log('[openIAService] analyzeText response:', content);
  //   const parsed = tryParseEmotion(content);
  //   return parsed ?? localHeuristic(text);
  // } catch (err) {
  //   console.error('[openIAService] analyzeText falling back to heuristic', err);
  //   return localHeuristic(text);
  // }
}

// Multi-emotion request for graph pipeline
export async function analyzeTextMulti(text: string): Promise<MultiEmotionResult | null> {
  if (!config.OPENAI_API_KEY) return null;
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
    const parsed = tryParseMulti(content);
    return parsed;
  } catch (err) {
    console.error('[openIAService] analyzeTextMulti failed', err);
    return null;
  }
}
