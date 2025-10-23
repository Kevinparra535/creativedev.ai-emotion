export interface Galaxy {
  id: string;
  name: string;                 // "Amor", "Miedo", etc.
  centroid?: [number, number, number];  // pos target del cluster
  radius?: number;              // radio del cluster
  members: string[];            // ids de Emotion
  colorHex?: string;            // tinte global de la galaxia
}
