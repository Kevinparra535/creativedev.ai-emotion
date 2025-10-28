import { useControls } from 'leva';

export type EmotionVisuals2 = {
  useTextureColor: boolean;
  textureColor: string; // hex
  spinSpeed: number; // multiplier over base spin
  bounce: number; // 0..1 amplitude driver
};

export function useEmotionVisuals2(): EmotionVisuals2 {
  const controls = useControls('Emotion Visuals 2.0', {
    spinSpeed: { value: 1, min: 0.2, max: 3, step: 0.05 },
    bounce: { value: 0.6, min: 0, max: 1, step: 0.01 }
  });
  return controls as EmotionVisuals2;
}
