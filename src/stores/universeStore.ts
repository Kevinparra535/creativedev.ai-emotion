import { create } from 'zustand';

import type { UniverseGraph } from '@/services/universeGraph';

export type UniverseState = {
  graph: UniverseGraph | null;
  setGraph: (g: UniverseGraph | null) => void;
};

export const useUniverseStore = create<UniverseState>((set) => ({
  graph: null,
  setGraph: (g) => set({ graph: g })
}));
