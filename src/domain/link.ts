export type LinkKind = "transition" | "polarity" | "cause" | "function" | "semantic";

export interface Link {
  id: string;
  source: string; // Emotion.id o Galaxy.id (si haces meta-nivel)
  target: string;
  weight: number; // [0,1] fuerza de conexión
  kind: LinkKind;
}
