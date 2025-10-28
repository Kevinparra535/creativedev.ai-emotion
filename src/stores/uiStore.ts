import { create } from 'zustand';

type FocusRequest = {
  target: [number, number, number];
  distance?: number; // camera distance from target along view direction
};

type UIState = {
  thinking: boolean;
  setThinking: (v: boolean) => void;
  cameraFocus: FocusRequest | null;
  focusOn: (req: FocusRequest) => void;
  clearFocus: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  thinking: false,
  setThinking: (v) => set({ thinking: v }),
  cameraFocus: null,
  focusOn: (req) => set({ cameraFocus: req }),
  clearFocus: () => set({ cameraFocus: null })
}));
