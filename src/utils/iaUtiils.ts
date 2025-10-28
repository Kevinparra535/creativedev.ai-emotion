// NOTE: This module parses loose AI outputs. Do not import domain Emotion here.
// We expose permissive shapes that upstream adapters convert into domain types.

// Multi-emotion types (for graph-ready responses)
export type MultiEmotionItem = {
  id?: string;
  label: string;
  weight: number; // 0..1
  valence?: number; // -1..1
  arousal?: number; // 0..1
  colors?: string[];
  intensity?: number; // 0..1
  relations?: string[]; // optional semantic neighbors
};

export type MultiEmotionResult = {
  emotions: MultiEmotionItem[];
  global?: { valence?: number; arousal?: number };
  pairs?: [string, string][]; // co-occurrence or semantic relations
};

export const promptToService = (): { role: string; content: string } => ({
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
      "- Si hay 2+ emociones, incluye AL MENOS 2 pares en 'pairs' y PRIORIZA pares entre clusters PRIMARIOS distintos",
      '  (love, joy, calm, anger, fear, sadness, surprise, nostalgia) o sus sinónimos (gratitude→joy, loneliness→sadness, etc).',
      '- Evita pares redundantes dentro del mismo cluster a menos que sea una relación muy fuerte.',
      "- Para cada emoción, rellena 'relations' con 2–5 labels (existentes o sinónimos) que ayuden a inferir conexiones.",
      '- Usa punto decimal; no uses NaN/Infinity ni null si puedes evitarlo.',
      '- Rango estricto: valence [-1,1], arousal [0,1], intensity [0,1], weight [0,1].',
      '- Si una emoción es implícita, inclúyela con weight bajo (p.ej. 0.15–0.35).',
      '- No incluyas campos adicionales fuera del esquema.',
      '- Responde SOLO el JSON (sin markdown, sin explicación).'
    ].join('\n')
  });

export const promptToUser = (text: string) => ({
    role: 'user',
    content: [
      'Analiza el siguiente texto y devuelve el JSON según el esquema indicado.',
      '- Identifica hasta 8 emociones (ordenadas por weight).',
      '- Si hay señales contextuales (p. ej. recuerdo → nostalgia), puedes incluir emociones implícitas con weight bajo.',
      "- En 'pairs', coloca co-ocurrencias/relaciones semánticas fuertes SOLO entre labels presentes en 'emotions'.",
      '- Si detectas más de una emoción relevante, incluye al menos 2 pares entre clusters distintos (love, joy, calm, anger, fear, sadness, surprise, nostalgia)',
      '  o sinónimos claros presentes en el texto (gratitude→joy, loneliness→sadness, serenity→calm, curiosity→surprise/joy).',
      '',
      `Texto: ${text}`
    ].join('\n')
  });

// Permissive single-emotion parsing result (upstream adapter will normalize)
export type LooseEmotion = {
  label: string;
  score?: number;
  valence?: number;
  arousal?: number;
  colors?: string[];
  intensity?: number;
  relations?: string[];
};

function toStringArray(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((c): c is string => typeof c === 'string') : [];
}

function extractColors(obj: Record<string, unknown>): string[] {
  const fromColors = toStringArray(obj.colors);
  if (fromColors.length) return fromColors;
  return toStringArray(obj.color);
}

function extractRelations(obj: Record<string, unknown>): string[] {
  const r = obj.relations;
  if (r && typeof r === 'object' && !Array.isArray(r)) {
    const entries = Object.entries(r).filter(([, v]) => typeof v === 'number') as [
      string,
      number
    ][];
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    return sorted.map(([k]) => k);
  }
  if (Array.isArray(r)) {
    return r.filter((e): e is string => typeof e === 'string');
  }
  return [];
}

export function tryParseEmotion(s: string): LooseEmotion | null {
  try {
    const match = /\{[\s\S]*\}/.exec(s);
    const json = match ? match[0] : null;
    if (!json) return null;
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return null;
    const obj: Record<string, unknown> = raw as Record<string, unknown>;
    const label = typeof obj.label === 'string' ? obj.label : undefined;
    if (!label) return null;
    // Accept both `colors` and legacy `color`
    const colors = extractColors(obj);
    // Accept relations as object map or array of strings, but return array of strings
    const relations = extractRelations(obj);

    return {
      label,
      score: typeof obj.score === 'number' ? obj.score : 1,
      valence: typeof obj.valence === 'number' ? obj.valence : 0,
      arousal: typeof obj.arousal === 'number' ? obj.arousal : 0.5,
      colors,
      intensity: typeof obj.intensity === 'number' ? obj.intensity : 0,
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
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return null;

    const emotionsRaw: any[] = Array.isArray(raw.emotions) ? raw.emotions : [];
    const emotions: MultiEmotionItem[] = emotionsRaw
      .map((e) => ({
        id: typeof e.id === 'string' ? e.id : undefined,
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
        intensity: typeof e.intensity === 'number' ? e.intensity : undefined,
        relations:
          e && typeof e === 'object' ? extractRelations(e as Record<string, unknown>) : undefined
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
