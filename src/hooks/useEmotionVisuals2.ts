import { useControls } from 'leva';

export type EmotionEffect = 'Watercolor' | 'Oil';

export type EmotionVisuals2 = {
  effect: EmotionEffect;
  spinSpeed: number; // multiplier over base spin
  bounce: number; // 0..1 amplitude driver
  // Watercolor params
  wcWash: number; // 0..0.3
  wcScale: number; // 0.5..3
  wcSharpness: number; // 1.2..3
  wcFlow: number; // 0.2..2
  // Oil params
  oilSwirl: number; // 0..2
  oilScale: number; // 0.5..3
  oilFlow: number; // 0.2..2
  oilShine: number; // 0..1
  oilContrast: number; // 1..4
};

export function useEmotionVisuals2(): { planetConfig: EmotionVisuals2 } {
  const planetConfig = useControls('Planet Emotions', {
    effect: { value: 'Watercolor' as EmotionEffect, options: ['Watercolor', 'Oil'] as const },
    spinSpeed: { value: 1, min: 0.2, max: 3, step: 0.05 },
    bounce: { value: 0.6, min: 0, max: 1, step: 0.01 },
    // Watercolor
    wcWash: {
      value: 0.06,
      min: 0,
      max: 0.3,
      step: 0.005,
      render: (get) => get('effect') === 'Watercolor'
    },
    wcScale: {
      value: 1,
      min: 0.5,
      max: 3,
      step: 0.05,
      render: (get) => get('effect') === 'Watercolor'
    },
    wcSharpness: {
      value: 2.2,
      min: 1.2,
      max: 3,
      step: 0.05,
      render: (get) => get('effect') === 'Watercolor'
    },
    wcFlow: {
      value: 1,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('effect') === 'Watercolor'
    },
    // Oil
    oilSwirl: { value: 0.9, min: 0, max: 2, step: 0.05, render: (get) => get('effect') === 'Oil' },
    oilScale: {
      value: 1.4,
      min: 0.5,
      max: 3,
      step: 0.05,
      render: (get) => get('effect') === 'Oil'
    },
    oilFlow: {
      value: 0.9,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('effect') === 'Oil'
    },
    oilShine: {
      value: 0.35,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => get('effect') === 'Oil'
    },
    oilContrast: {
      value: 2.2,
      min: 1,
      max: 4,
      step: 0.05,
      render: (get) => get('effect') === 'Oil'
    }
  });
  return { planetConfig: planetConfig as EmotionVisuals2 };
}
