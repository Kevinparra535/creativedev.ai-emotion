import { create } from "zustand";

import type { Emotion } from "@/domain/emotion";
import type { Galaxy } from "@/domain/galaxy";
import type { LayoutConfig } from "@/domain/layout";
import type { Link } from "@/domain/link";

interface UniverseState {
  emotions: Emotion[];
  galaxies: Galaxy[];
  links: Link[];
  positions: Record<string, [number, number, number]>;
  layout: LayoutConfig;
  setData: (payload: { emotions: Emotion[]; galaxies: Galaxy[]; links: Link[] }) => void;
  setPositions: (pos: Record<string, [number, number, number]>) => void;
  setLayout: (cfg: Partial<LayoutConfig>) => void;
}

export const useUniverse = create<UniverseState>((set) => ({
  emotions: [],
  galaxies: [],
  links: [],
  positions: {},
  layout: { mode: "sphericalVA" },
  setData: (p) => set(p),
  setPositions: (pos) => set({ positions: pos }),
  setLayout: (cfg) => set((s) => ({ layout: { ...s.layout, ...cfg } })),
}));
