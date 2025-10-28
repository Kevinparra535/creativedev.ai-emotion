import type { Emotion } from '@/domain/emotion';
import { expandFromDominant, type MultiEmotionResult } from '@/ai/local-emotions';
import { emotionService } from '@/services/EmotionServiceFactory';
import { AFFECT_DEFAULTS } from '@/systems/ClusterEngine';

export type UniverseNode = {
  label: string;
  weight: number; // accumulated frequency × intensity
  valence: number; // [-1,1]
  arousal: number; // [0,1]
  colors?: string[];
};

export type UniverseEdge = {
  source: string;
  target: string;
  weight: number; // co-occurrence count or semantic strength
  type: 'cooccurrence' | 'semantic';
};

export type UniverseGraph = {
  nodes: UniverseNode[];
  edges: UniverseEdge[];
  summary: { valence: number; arousal: number };
};

// Centralized affect defaults come from ClusterEngine (aligned with emotion-clusters)

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?\n;])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function analyzeTextToGraph(text: string): Promise<UniverseGraph> {
  const sentences = splitSentences(text);

  // Accumulators
  const weightMap = new Map<string, number>();
  const valSum = new Map<string, number>();
  const aroSum = new Map<string, number>();
  const colorMap = new Map<string, string[]>();
  let globalVal = 0;
  let globalAro = 0;
  let globalW = 0;

  const coCount = new Map<string, number>(); // 'a|b' -> count
  const semanticSet = new Map<string, number>(); // 'a|b' -> count

  // For each sentence, try multi-emotion analysis; fallback to single with expansion
  for (const s of sentences) {
    if (!s) continue;
    let multi: MultiEmotionResult | null = null;
    try {
      multi = await analyzeTextMulti(s);
    } catch {
      multi = null;
    }

    if (!multi || !multi.emotions?.length) {
      // fallback to dominant + expansion
      let dom: Emotion | null = null;
      try {
        dom = await analyzeText(s);
      } catch {
        dom = null;
      }
      if (dom) multi = expandFromDominant(dom);
      else continue;
    }

    // Aggregate sentence emotions
    const emos = multi.emotions.slice(0, 8);
    const labelsInSentence: string[] = [];
    for (const e of emos) {
      const label = e.label.toLowerCase();
      const w = Math.max(0, Math.min(1, e.weight ?? 0));
      if (w <= 0) continue;
      weightMap.set(label, (weightMap.get(label) ?? 0) + w);
      if (typeof e.valence === 'number')
        valSum.set(label, (valSum.get(label) ?? 0) + e.valence * w);
      if (typeof e.arousal === 'number')
        aroSum.set(label, (aroSum.get(label) ?? 0) + e.arousal * w);
      if (Array.isArray(e.colors) && e.colors.length && !colorMap.has(label))
        colorMap.set(label, e.colors);
      labelsInSentence.push(label);
    }

    // Global affect (weighted by sum of weights in sentence)
    const sentW = emos.reduce((acc: number, e) => acc + (e.weight ?? 0), 0);
    if (multi.global) {
      if (typeof multi.global.valence === 'number') globalVal += multi.global.valence * sentW;
      if (typeof multi.global.arousal === 'number') globalAro += multi.global.arousal * sentW;
      globalW += sentW;
    }

    // Co-occurrence pairs (count once per sentence per pair)
    for (let i = 0; i < labelsInSentence.length; i++) {
      for (let j = i + 1; j < labelsInSentence.length; j++) {
        const a = labelsInSentence[i];
        const b = labelsInSentence[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        coCount.set(key, (coCount.get(key) ?? 0) + 1);
      }
    }

    // Semantic pairs provided by model
    for (const p of multi.pairs ?? []) {
      const [a, b] = p;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      semanticSet.set(key, (semanticSet.get(key) ?? 0) + 1);
    }
  }

  const nodes: UniverseNode[] = [];
  for (const [label, weight] of weightMap) {
    const v = valSum.get(label);
    const a = aroSum.get(label);
    const def = AFFECT_DEFAULTS[label];
    const normV = v !== undefined ? v / weight : (def?.valence ?? 0);
    const normA = a !== undefined ? a / weight : (def?.arousal ?? 0.5);
    const colors = colorMap.get(label);
    nodes.push({ label, weight, valence: normV, arousal: normA, colors });
  }

  // Semantic edges placeholder (can be enriched later)
  const edges: UniverseEdge[] = [];
  for (const [key, w] of coCount) {
    const [a, b] = key.split('|');
    if (weightMap.has(a) && weightMap.has(b))
      edges.push({ source: a, target: b, weight: w, type: 'cooccurrence' });
  }
  for (const [key, w] of semanticSet) {
    const [a, b] = key.split('|');
    if (weightMap.has(a) && weightMap.has(b))
      edges.push({ source: a, target: b, weight: w, type: 'semantic' });
  }

  const summary = {
    valence: globalW > 0 ? globalVal / globalW : 0,
    arousal: globalW > 0 ? globalAro / globalW : 0.5
  };

  return { nodes, edges, summary };
}

async function analyzeTextMulti(s: string): Promise<MultiEmotionResult | null> {
  // Use the adapter single analyze and expand to a multi as a simple implementation
  try {
    const dominant = await emotionService.analyze(s);
    if (!dominant) return null;
    return expandFromDominant(dominant);
  } catch {
    return null;
  }
}

export async function analyzeText(s: string): Promise<Emotion | null> {
  try {
    return await emotionService.analyze(s);
  } catch {
    return null;
  }
}
