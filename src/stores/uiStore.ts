import { create } from 'zustand';

type UIState = {
  thinking: boolean;
  setThinking: (v: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  thinking: true,
  setThinking: (v) => set({ thinking: v })
}));
