import type { Emotion } from '@/domain/emotion';

// Multi-emotion types (for graph-ready responses)
export type MultiEmotionItem = {
  label: string;
  weight: number; // 0..1
  valence?: number; // -1..1
  arousal?: number; // 0..1
  colors?: string[];
  intensity?: number; // 0..1
};

export type MultiEmotionResult = {
  emotions: MultiEmotionItem[];
  global?: { valence?: number; arousal?: number };
  pairs?: [string, string][]; // co-occurrence or semantic relations
};

export const promptToService = (): { role: string; content: string } => {
  return {
    role: 'system',
    content:
      'Eres un analizador emocional. Devuelve SOLO JSON válido con este formato: {"emotions":[{"label":"joy","weight":0.62,"valence":0.8,"arousal":0.6,"colors":["#FFD54F"],"intensity":0.7}],"global":{"valence":0.25,"arousal":0.55},"pairs":[["joy","nostalgia"],["love","gratitude"]]}'
  };
};

export const promptToUser = (text: string) => {
  return {
    role: 'user',
    content: `Analiza el siguiente texto.
              - Devuelve hasta 8 emociones en "emotions" ordenadas por weight (0..1).
              - "pairs" son co-ocurrencias o relaciones semánticas fuertes.
              - Si una emoción está implícita por contexto (p.ej., nostalgia con recuerdo), inclúyela con weight bajo.

              Texto: ${text}
            `
  };
};

export function tryParseEmotion(s: string): Emotion | null {
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

export function tryParseMulti(s: string): MultiEmotionResult | null {
  try {
    const match = /\{[\s\S]*\}/.exec(s);
    const json = match ? match[0] : null;
    if (!json) return null;
    const raw = JSON.parse(json) as any;
    if (!raw || typeof raw !== 'object') return null;

    const emotionsRaw: any[] = Array.isArray(raw.emotions) ? raw.emotions : [];
    const emotions: MultiEmotionItem[] = emotionsRaw
      .map((e) => ({
        label: typeof e.label === 'string' ? e.label.toLowerCase() : undefined,
        weight:
          typeof e.weight === 'number' ? e.weight : typeof e.score === 'number' ? e.score : 0,
        valence: typeof e.valence === 'number' ? e.valence : undefined,
        arousal: typeof e.arousal === 'number' ? e.arousal : undefined,
        colors: Array.isArray(e.colors)
          ? e.colors.filter((c: unknown) => typeof c === 'string')
          : Array.isArray(e.color)
            ? e.color.filter((c: unknown) => typeof c === 'string')
            : undefined,
        intensity: typeof e.intensity === 'number' ? e.intensity : undefined
      }))
      .filter((e) => e.label && e.weight > 0) as MultiEmotionItem[];

    const global =
      raw.global && typeof raw.global === 'object'
        ? {
            valence: typeof raw.global.valence === 'number' ? raw.global.valence : undefined,
            arousal: typeof raw.global.arousal === 'number' ? raw.global.arousal : undefined
          }
        : undefined;

    const pairs: [string, string][] = Array.isArray(raw.pairs)
      ? (raw.pairs
          .map((p: any) =>
            Array.isArray(p) &&
            p.length >= 2 &&
            typeof p[0] === 'string' &&
            typeof p[1] === 'string'
              ? [p[0].toLowerCase(), p[1].toLowerCase()]
              : null
          )
          .filter(Boolean) as [string, string][])
      : [];

    return { emotions, global, pairs };
  } catch {
    return null;
  }
}

// Fallback: expand single dominant into a small multi list using relations
export function expandFromDominant(d: Emotion): MultiEmotionResult {
  const baseW = Math.max(0, Math.min(1, d.intensity ?? d.score ?? 0.6));
  const emotions: MultiEmotionItem[] = [
    {
      label: d.label.toLowerCase(),
      weight: Math.min(1, baseW),
      valence: d.valence,
      arousal: d.arousal,
      colors: d.colors,
      intensity: d.intensity
    }
  ];
  const rels = (d.relations ?? []).slice(0, 5);
  for (let i = 0; i < rels.length; i++) {
    const r = rels[i].toLowerCase();
    const w = baseW * (0.25 + 0.25 * (1 - i / rels.length)); // 25–50% decaying
    emotions.push({ label: r, weight: w });
  }
  const pairs: [string, string][] = emotions.slice(1).map((e) => [emotions[0].label, e.label]);
  return { emotions, global: { valence: d.valence, arousal: d.arousal }, pairs };
}

export function localHeuristic(text: string): Emotion {
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
