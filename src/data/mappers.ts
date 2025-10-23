import type { MultiEmotionItem, MultiEmotionResult } from '@/domain/emotion';
import type { UniverseGraph, UniverseNode, UniverseEdge } from '@/domain/galaxy';

// Minimal placeholder: assume GraphBuilder handles heavy lifting.
export function multiEmotionsToGraph(multi: MultiEmotionResult | null): UniverseGraph | null {
  if (!multi || !multi.emotions?.length) return null;
  const nodes: UniverseNode[] = multi.emotions.map((e: MultiEmotionItem) => ({
    label: e.label.toLowerCase(),
    weight: e.weight,
    valence: e.valence ?? 0,
    arousal: e.arousal ?? 0.5,
    colors: e.colors
  }));
  const edges: UniverseEdge[] = (multi.pairs ?? []).map(([a, b]: [string, string]) => ({ source: a, target: b, weight: 1, type: 'semantic' as const }));
  const summary = {
    valence: nodes.length ? nodes.reduce((s: number, n: UniverseNode) => s + n.valence * n.weight, 0) / nodes.length : 0,
    arousal: nodes.length ? nodes.reduce((s: number, n: UniverseNode) => s + n.arousal * n.weight, 0) / nodes.length : 0.5
  };
  return { nodes, edges, summary };
}
