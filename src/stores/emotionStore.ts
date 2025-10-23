import type { Emotion } from '@/domain/emotion';
import { create } from 'zustand';

export type EmotionState = {
  current: Emotion | null;
  setCurrent: (e: Emotion | null) => void;
};

export const useEmotionStore = create<EmotionState>((set) => ({
  current: null,
  setCurrent: (e) => set({ current: e })
}));
