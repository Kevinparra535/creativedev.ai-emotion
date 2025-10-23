// -----------------------------
// Types (salida JSON del prompt)
// -----------------------------
export interface MultiEmotionItem {
  label: string; // minúsculas, snake/camel aceptable
  weight: number; // [0,1]
  valence?: number; // [-1,1]
  arousal?: number; // [0,1]
  colors?: string[]; // ["#RRGGBB"]
  intensity?: number; // [0,1]
  relations?: string[]; // labels sugeridos (opcional)
}

export interface MultiEmotionResult {
  version: 1;
  emotions: MultiEmotionItem[]; // máx 8, ordenado por weight DESC
  global: {
    // resumen del texto
    valence: number; // [-1,1]
    arousal: number; // [0,1]
  };
  pairs: [string, string][]; // co-ocurrencias entre labels presentes en "emotions"
}

// Fuente dominante (heurística local)
export interface Emotion {
  label: string;
  score?: number; // 0..1
  valence: number; // [-1,1]
  arousal: number; // [0,1]
  colors?: string[];
  intensity?: number; // 0..1
  relations?: string[];
}

// -----------------------------
// Helpers
// -----------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampRange = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hexOk = (h: string) => /^#([0-9A-Fa-f]{6})$/.test(h);

function normLabel(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '_');
}

function sanitizeItem(e: MultiEmotionItem): MultiEmotionItem {
  const label = normLabel(e.label);
  const weight = clamp01(e.weight);
  const valence = e.valence === undefined ? undefined : clampRange(e.valence, -1, 1);
  const arousal = e.arousal === undefined ? undefined : clampRange(e.arousal, 0, 1);
  const intensity = e.intensity === undefined ? undefined : clamp01(e.intensity);
  const colors = e.colors?.filter(hexOk);
  const relations = e.relations?.map(normLabel);
  return { label, weight, valence, arousal, colors, intensity, relations };
}

// -----------------------------
// Expand: dominante -> payload JSON
// -----------------------------
/**
 * Parte de una emoción dominante y expande hasta un payload válido con:
 * - emotions (máx 8, ordenado por weight DESC)
 * - pairs coherentes con labels presentes
 * - global (copia valence/arousal del dominante si hay)
 */
export function expandFromDominant(d: Emotion): MultiEmotionResult {
  const baseW = clamp01(d.intensity ?? d.score ?? 0.6);

  // item principal
  const seed: MultiEmotionItem = sanitizeItem({
    label: d.label,
    weight: baseW,
    valence: d.valence,
    arousal: d.arousal,
    colors: d.colors,
    intensity: d.intensity
  });

  // relaciones → secundarios (decay 50%→25%)
  const rels = (d.relations ?? []).map(normLabel);
  const take = Math.max(0, Math.min(7, rels.length)); // 1 (seed) + 7 (rels) = 8 total
  const emotions: MultiEmotionItem[] = [seed];

  for (let i = 0; i < take; i++) {
    const r = rels[i];
    const w = baseW * (0.5 - 0.25 * (i / Math.max(1, take - 1))); // 0.5 → 0.25
    emotions.push(sanitizeItem({ label: r, weight: clamp01(w) }));
  }

  // de-duplicar por label manteniendo el primero (peso mayor)
  const byLabel = new Map<string, MultiEmotionItem>();
  for (const e of emotions) {
    if (!byLabel.has(e.label)) byLabel.set(e.label, e);
  }
  // lista final, recorta a 8 y ordena
  const finalList = Array.from(byLabel.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  // pairs = seed con cada secundario real presente
  const root = finalList[0]?.label ?? 'neutral';
  const pairs: [string, string][] = finalList.slice(1).map((e) => [root, e.label] as [string, string]);

  // global = del dominante
  const global = {
    valence: clampRange(d.valence ?? 0, -1, 1),
    arousal: clampRange(d.arousal ?? 0.5, 0, 1)
  };

  return {
    version: 1 as const,
    emotions: finalList,
    global,
    pairs
  };
}

// -----------------------------
// Heurística local (tu lógica + pequeñas mejoras)
// -----------------------------
/**
 * Devuelve UNA emoción dominante normalizada (rango/labels/colores),
 * lista para pasar a expandFromDominant.
 */
export function localHeuristic(text: string): Emotion {
  const t = text.toLowerCase().trim();

  // Neutral vacío
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

  // === Patrones primarios ===
  const joy = /(feliz|felicidad|alegr|content|sonrisa|gracias|amor|diver|entusias|esperanz|😊|😀|🥰|😍)/.test(t);
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

  // === Respuestas (normalizadas) ===
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

  // Default neutral
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

// -----------------------------
// Facade conveniente
// -----------------------------
/**
 * Entrada: texto libre.
 * Salida: payload JSON listo para tu mapper/renderer.
 */
export function buildPayloadFromText(text: string): MultiEmotionResult {
  const dominant = localHeuristic(text);
  return expandFromDominant(dominant);
}
