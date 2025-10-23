export type Valence = number; // [-1, 1]
export type Arousal = number; // [0, 1]
export type Intensity = number; // [0, 1]

export interface Emotion {
  id: string;
  label: string; // "joy", "fear", etc.
  valence: Valence; // -1 (neg) ... 1 (pos)
  arousal: Arousal; // 0 (calma) ... 1 (activación)
  intensity?: Intensity; // opcional
  colorHex?: string; // si viene del motor semántico
  meta?: Record<string, unknown>;
}
