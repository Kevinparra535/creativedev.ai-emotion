import { useEmotionStore, useUniverseStore } from './universe.store';

export const useCurrentEmotion = () => useEmotionStore((s) => s.current);
export const useUniverseGraph = () => useUniverseStore((s) => s.graph);
