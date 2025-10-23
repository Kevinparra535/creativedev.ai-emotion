export interface AIEmotionNode {
  label: string;            // "joy"
  score?: number;           // confianza
  valence?: number;         // 0..1 o -1..1 según el proveedor
  arousal?: number;         // 0..1
  colors?: string[];        // paleta sugerida
  intensity?: number;       // 0..1
  relations?: string[];     // ["nostalgia", "gratitude", ...]
}

export interface AIEmotionPayload {
  nodes: AIEmotionNode[];
  edges?: Array<{ source: string; target: string; kind?: string; weight?: number; }>;
}
