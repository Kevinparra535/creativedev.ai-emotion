import { create } from 'zustand';
import type { EmotionResponse } from '@/services/openIAService';

export type EmotionState = {
  current: EmotionResponse | null;
  setCurrent: (e: EmotionResponse | null) => void;
};

export const useEmotionStore = create<EmotionState>((set) => ({
  current: null,
  setCurrent: (e) => set({ current: e })
}));
