import { useControls } from 'leva';

export type EmotionVisuals2 = {
  effect: 'Watercolor';
  spinSpeed: number; // multiplier over base spin
  bounce: number; // 0..1 amplitude driver
  // Watercolor params
  wcWash: number; // 0..0.3
  wcScale: number; // 0.5..3
  wcSharpness: number; // 1.2..3
  wcFlow: number; // 0.2..2
};

export function useEmotionVisuals2(): EmotionVisuals2 {
  const controls = useControls('Emotion Visuals 2.0', {
    effect: { value: 'Watercolor', options: ['Watercolor'] as const },
    spinSpeed: { value: 1, min: 0.2, max: 3, step: 0.05 },
    bounce: { value: 0, min: 0, max: 1, step: 0.01 },
    wcWash: { value: 0.06, min: 0, max: 0.3, step: 0.005 },
    wcScale: { value: 1, min: 0.5, max: 3, step: 0.05 },
    wcSharpness: { value: 2.2, min: 1.2, max: 3, step: 0.05 },
    wcFlow: { value: 1, min: 0.2, max: 2, step: 0.05 }
  });
  return controls as EmotionVisuals2;
}
