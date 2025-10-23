import { analyzeText, type EmotionResponse } from '@/services/openIAService';

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

// Default affective positioning for primaries (fallbacks if model doesn't provide per-node stats)
const DEFAULT_AFFECT: Record<string, { valence: number; arousal: number }> = {
  love: { valence: 0.85, arousal: 0.6 },
  joy: { valence: 0.9, arousal: 0.7 },
  calm: { valence: 0.6, arousal: 0.2 },
  sadness: { valence: -0.7, arousal: 0.3 },
  fear: { valence: -0.85, arousal: 0.8 },
  anger: { valence: -0.7, arousal: 0.7 },
  surprise: { valence: 0.2, arousal: 0.9 },
  nostalgia: { valence: 0.2, arousal: 0.4 }
};

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
  let valenceSum = 0;
  let arousalSum = 0;
  let totalWeight = 0;

  // NOTE: For now we call analyzeText per sentence and take the dominant emotion only.
  // Future: switch analyzeText to return topK emotions per sentence.
  for (const s of sentences) {
    if (!s) continue;
    let result: EmotionResponse | null = null;
    try {
      result = await analyzeText(s);
    } catch {
      result = null;
    }
    if (!result) continue;

    const label = result.label?.toLowerCase();
    if (!label) continue;
    const w = Math.max(0, Math.min(1, result.intensity ?? result.score ?? 0.6));
    weightMap.set(label, (weightMap.get(label) ?? 0) + w);

    // Global affect (weighted)
    valenceSum += (result.valence ?? 0) * w;
    arousalSum += (result.arousal ?? 0.5) * w;
    totalWeight += w;
  }

  const nodes: UniverseNode[] = [];
  for (const [label, weight] of weightMap) {
    const affect = DEFAULT_AFFECT[label] ?? { valence: 0, arousal: 0.5 };
    nodes.push({ label, weight, valence: affect.valence, arousal: affect.arousal });
  }

  // Semantic edges placeholder (can be enriched later)
  const semanticPairs: Array<[string, string]> = [
    ['love', 'joy'],
    ['joy', 'surprise'],
    ['calm', 'nostalgia'],
    ['sadness', 'nostalgia'],
    ['fear', 'anger'],
    ['anger', 'sadness']
  ];
  const edges: UniverseEdge[] = semanticPairs
    .filter(([a, b]) => weightMap.has(a) && weightMap.has(b))
    .map(([a, b]) => ({ source: a, target: b, weight: 1, type: 'semantic' as const }));

  const summary = {
    valence: totalWeight > 0 ? valenceSum / totalWeight : 0,
    arousal: totalWeight > 0 ? arousalSum / totalWeight : 0.5
  };

  return { nodes, edges, summary };
}
