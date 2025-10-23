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
    content: [
      'Eres un analizador emocional. Responde ÚNICAMENTE con JSON válido UTF-8 sin comentarios ni texto extra.',
      'Formato estricto (version=1):',
      '{',
      '  "version": 1,',
      '  "emotions": [',
      '    {',
      '      "label": "joy",                  // string en minúsculas, sin espacios',
      '      "weight": 0.62,                 // [0,1]',
      '      "valence": 0.80,                // [-1,1]  (negativo=aversion, positivo=agrado)',
      '      "arousal": 0.60,                // [0,1]   (0=calma, 1=alta activación)',
      '      "intensity": 0.70,              // [0,1]',
      '      "colors": ["#FFD54F"],          // array opcional de hex válidos #RRGGBB',
      '      "relations": ["nostalgia","gratitude","love","surprise","calm"] // opcional',
      '    }',
      '  ],',
      '  "global": {                         // resumen del texto',
      '    "valence": 0.25,                  // [-1,1]',
      '    "arousal": 0.55                   // [0,1]',
      '  },',
      '  "pairs": [                          // co-ocurrencias/relaciones fuertes ENTRE labels del array emotions',
      '    ["joy","nostalgia"],',
      '    ["love","gratitude"]',
      '  ]',
      '}',
      '',
      'Reglas:',
      '- Devuelve hasta 8 emociones ya ordenadas por weight DESC.',
      "- Todas las etiquetas de 'pairs' DEBEN existir en 'emotions.label'.",
      '- Usa punto decimal; no uses NaN/Infinity ni null si puedes evitarlo.',
      '- Rango estricto: valence [-1,1], arousal [0,1], intensity [0,1], weight [0,1].',
      '- Si una emoción es implícita, inclúyela con weight bajo (p.ej. 0.15–0.35).',
      '- No incluyas campos adicionales fuera del esquema.',
      '- Responde SOLO el JSON (sin markdown, sin explicación).'
    ].join('\n')
  };
};

export const promptToUser = (text: string) => {
  return {
    role: 'user',
    content: [
      'Analiza el siguiente texto y devuelve el JSON según el esquema indicado.',
      '- Identifica hasta 8 emociones (ordenadas por weight).',
      '- Si hay señales contextuales (p. ej. recuerdo → nostalgia), puedes incluir emociones implícitas con weight bajo.',
      "- En 'pairs', coloca co-ocurrencias/relaciones semánticas fuertes SOLO entre labels presentes en 'emotions'.",
      '',
      `Texto: ${text}`
    ].join('\n')
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
