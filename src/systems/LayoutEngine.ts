import type { Emotion } from "@/domain/emotion";

export interface PositionedNode {
  id: string;
  position: [number, number, number];
}

export class LayoutEngine {
  static sphericalVA(emotions: Emotion[], radius = 20): PositionedNode[] {
    return emotions.map((e) => {
      const theta = (e.valence + 1) * Math.PI; // [-1,1] -> [0, 2π]
      const phi = (1 - e.arousal) * Math.PI; // [0,1]  -> [π, 0] (arriba=activación)
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return { id: e.id, position: [x, y, z] };
    });
  }
}
