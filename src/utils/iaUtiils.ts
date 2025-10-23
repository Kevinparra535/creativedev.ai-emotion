import type { EmotionResponse } from '@/services/openIAService';

export const promptToService = (): { role: string; content: string } => {
  return {
    role: 'system',
    content: `
    Eres un analizador emocional y visual.
    Tu tarea es interpretar el texto recibido y devolver un JSON con los siguientes campos para visualizar emociones en un mapa 3D:

    {
      "label": "nombre_de_emoción_principal_en_inglés",
      "score": "nivel de confianza (0..1)",
      "valence": "nivel de positividad (-1..1)",
      "arousal": "nivel de activación o energía (0..1)",
      "colors": ["#HEX1", "#HEX2"],
      "intensity": "intensidad visual (0..1, define brillo/tamaño)",
      "relations": ["otras emociones relacionadas"]
    }

    Instrucciones:
    - Si el texto expresa varias emociones, elige la dominante.
    - Si el texto es neutro o ambiguo, usa label: "neutral".
    - Los colores deben corresponder a la emoción (inspirados en la rueda de Plutchik).
    - Usa valence positivo para emociones agradables (joy, love, gratitude, etc.)
      y negativo para emociones desagradables (fear, sadness, anger, disgust).
    - Usa arousal para indicar energía:
      bajo = calma, alto = excitación o estrés.
    - Devuelve solo JSON válido, sin texto adicional.
`
  };
};

export function tryParseEmotion(s: string): EmotionResponse | null {
  try {
    const match = /\{[\s\S]*\}/.exec(s);
    const json = match ? match[0] : null;
    if (!json) return null;
    const raw = JSON.parse(json) as any;
    if (!raw || typeof raw !== 'object') return null;
    const label = typeof raw.label === 'string' ? raw.label : undefined;
    if (!label) return null;

    // Accept both `colors` and legacy `color`
    const colors: string[] = Array.isArray(raw.colors)
      ? raw.colors.filter((c: unknown) => typeof c === 'string')
      : Array.isArray(raw.color)
      ? raw.color.filter((c: unknown) => typeof c === 'string')
      : [];

    // Accept relations as object map or array of strings, but return array of strings
    let relations: string[] = [];
    if (raw.relations && typeof raw.relations === 'object' && !Array.isArray(raw.relations)) {
      const entries = Object.entries(raw.relations).filter(([, v]) => typeof v === 'number') as [
        string,
        number
      ][];
      // sort by weight desc and take keys
      relations = entries.sort((a, b) => b[1] - a[1]).map(([k]) => k);
    } else if (Array.isArray(raw.relations)) {
      relations = (raw.relations as unknown[]).filter((e) => typeof e === 'string') as string[];
    }

    return {
      label,
      score: typeof raw.score === 'number' ? raw.score : 1,
      valence: typeof raw.valence === 'number' ? raw.valence : 0,
      arousal: typeof raw.arousal === 'number' ? raw.arousal : 0.5,
      colors,
      intensity: typeof raw.intensity === 'number' ? raw.intensity : 0,
      relations
    };
  } catch {
    return null;
  }
}

export function localHeuristic(text: string): EmotionResponse {
  const t = text.toLowerCase().trim();

  if (!t)
    return {
      label: 'neutral',
      score: 1,
      valence: 0,
      arousal: 0.2,
      colors: ['#B0BEC5'],
      intensity: 0.1,
      relations: []
    };

  // === Primary emotion patterns ===
  const joy =
    /(feliz|felicidad|alegr|content|sonrisa|gracias|amor|diver|entusias|esperanz|😊|😀|🥰|😍)/.test(
      t
    );
  const calm = /(calma|tranquil|relajad|seren|paz|equilibri|control|🧘‍♂️|🌿)/.test(t);
  const sadness = /(triste|deprim|lloro|pena|soledad|fracaso|perd|😢|😭|💔)/.test(t);
  const fear = /(miedo|ansied|nerv|preocup|insegur|temor|😨|😰|😱)/.test(t);
  const anger = /(enojo|enojad|ira|furia|frustr|molest|indign|😡|🤬)/.test(t);
  const nostalgia = /(recuerdo|nostal|extraño|añoro|melanc|pasado|tiempo|viejo|💭)/.test(t);
  const surprise = /(sorprend|asombro|incred|wow|😲|😮|😯|impact)/.test(t);
  const love = /(amor|cariñ|afect|ternur|abrazo|beso|❤️|💞|💓|💕)/.test(t);
  const gratitude = /(gracia|agradec|bendic|🙏|grateful|thank)/.test(t);
  const disgust = /(asco|repugn|rechazo|od|🤢|🤮|repuls)/.test(t);
  const curiosity = /(curios|interes|explor|descubr|aprend|🤔|🔍)/.test(t);
  const pride = /(orgull|logr|éxito|meta|super|victoria|🏆|🎉)/.test(t);

  // === Emotion responses ===
  if (joy)
    return {
      label: 'joy',
      score: 0.92,
      valence: 0.8,
      arousal: 0.6,
      colors: ['#FFD54F', '#FFF176'],
      intensity: 0.8,
      relations: ['love', 'gratitude', 'surprise']
    };

  if (calm)
    return {
      label: 'calm',
      score: 0.87,
      valence: 0.4,
      arousal: 0.2,
      colors: ['#81C784', '#A5D6A7'],
      intensity: 0.3,
      relations: ['serenity', 'trust', 'hope']
    };

  if (sadness)
    return {
      label: 'sadness',
      score: 0.88,
      valence: -0.6,
      arousal: 0.3,
      colors: ['#64B5F6', '#2196F3'],
      intensity: 0.5,
      relations: ['nostalgia', 'empathy', 'reflection']
    };

  if (fear)
    return {
      label: 'fear',
      score: 0.9,
      valence: -0.7,
      arousal: 0.8,
      colors: ['#4FC3F7', '#0288D1'],
      intensity: 0.9,
      relations: ['anxiety', 'anticipation']
    };

  if (anger)
    return {
      label: 'anger',
      score: 0.9,
      valence: -0.8,
      arousal: 0.85,
      colors: ['#E57373', '#F44336'],
      intensity: 0.95,
      relations: ['frustration', 'rage', 'defense']
    };

  if (nostalgia)
    return {
      label: 'nostalgia',
      score: 0.82,
      valence: -0.2,
      arousal: 0.35,
      colors: ['#90CAF9', '#B3E5FC'],
      intensity: 0.4,
      relations: ['sadness', 'love', 'memory']
    };

  if (surprise)
    return {
      label: 'surprise',
      score: 0.84,
      valence: 0.3,
      arousal: 0.8,
      colors: ['#FFB74D', '#FFA726'],
      intensity: 0.7,
      relations: ['curiosity', 'joy', 'fear']
    };

  if (love)
    return {
      label: 'love',
      score: 0.9,
      valence: 0.9,
      arousal: 0.5,
      colors: ['#F06292', '#F48FB1'],
      intensity: 0.8,
      relations: ['joy', 'gratitude', 'trust']
    };

  if (gratitude)
    return {
      label: 'gratitude',
      score: 0.88,
      valence: 0.8,
      arousal: 0.4,
      colors: ['#FFD740', '#FFF59D'],
      intensity: 0.6,
      relations: ['love', 'joy']
    };

  if (disgust)
    return {
      label: 'disgust',
      score: 0.83,
      valence: -0.7,
      arousal: 0.6,
      colors: ['#8D6E63', '#6D4C41'],
      intensity: 0.7,
      relations: ['anger', 'fear']
    };

  if (curiosity)
    return {
      label: 'curiosity',
      score: 0.86,
      valence: 0.4,
      arousal: 0.5,
      colors: ['#BA68C8', '#CE93D8'],
      intensity: 0.5,
      relations: ['surprise', 'joy']
    };

  if (pride)
    return {
      label: 'pride',
      score: 0.88,
      valence: 0.7,
      arousal: 0.6,
      colors: ['#FFD740', '#FFC107'],
      intensity: 0.7,
      relations: ['joy', 'confidence']
    };

  // === Default ===
  return {
    label: 'neutral',
    score: 0.6,
    valence: 0,
    arousal: 0.3,
    colors: ['#B0BEC5'],
    intensity: 0.2,
    relations: []
  };
}
