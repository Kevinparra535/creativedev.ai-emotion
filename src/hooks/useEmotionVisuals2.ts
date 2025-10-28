import { useControls } from 'leva';

export type EmotionEffect = 'Watercolor' | 'Oil' | 'Link' | 'Holographic';

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
  // Link params
  linkDensity: number; // 0.5..4
  linkThickness: number; // 0.1..1.2
  linkNoise: number; // 0..1
  linkFlow: number; // 0.2..2
  linkContrast: number; // 1..4
  // Holographic params
  holoIntensity: number; // 0..1
  holoFresnel: number; // 1..6
  holoDensity: number; // 2..24
  holoThickness: number; // 0.1..1.0
  holoSpeed: number; // 0.2..2.0
};

export function useEmotionVisuals2(): { planetConfig: EmotionVisuals2 } {
  const planetConfig = useControls('Planet Emotions', {
    effect: {
      value: 'Watercolor' as EmotionEffect,
      options: ['Watercolor', 'Oil', 'Link', 'Holographic'] as const
    },
    spinSpeed: { value: 1, min: 0.2, max: 3, step: 0.05 },
    bounce: { value: 0, min: 0, max: 1, step: 0.01 },
    // Watercolor
    wcWash: {
      value: 0.06,
      min: 0,
      max: 0.3,
      step: 0.005,
      // Explicit path to avoid scope issues in Leva when using folders
      render: (get) => get('Planet Emotions.effect') === 'Watercolor'
    },
    wcScale: {
      value: 1,
      min: 0.5,
      max: 3,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Watercolor'
    },
    wcSharpness: {
      value: 2.2,
      min: 1.2,
      max: 3,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Watercolor'
    },
    wcFlow: {
      value: 1,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Watercolor'
    },
    // Oil
    oilSwirl: {
      value: 0.9,
      min: 0,
      max: 2,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Oil'
    },
    oilScale: {
      value: 1.4,
      min: 0.5,
      max: 3,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Oil'
    },
    oilFlow: {
      value: 0.9,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Oil'
    },
    oilShine: {
      value: 0.35,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => get('Planet Emotions.effect') === 'Oil'
    },
    oilContrast: {
      value: 2.2,
      min: 1,
      max: 4,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Oil'
    },
    // Link
    linkDensity: {
      value: 1.2,
      min: 0.5,
      max: 4,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Link'
    },
    linkThickness: {
      value: 0.5,
      min: 0.1,
      max: 1.2,
      step: 0.02,
      render: (get) => get('Planet Emotions.effect') === 'Link'
    },
    linkNoise: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.02,
      render: (get) => get('Planet Emotions.effect') === 'Link'
    },
    linkFlow: {
      value: 1,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Link'
    },
    linkContrast: {
      value: 2,
      min: 1,
      max: 4,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Link'
    },
    // Holographic
    holoIntensity: {
      value: 0.75,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => get('Planet Emotions.effect') === 'Holographic'
    },
    holoFresnel: {
      value: 3,
      min: 1,
      max: 6,
      step: 0.1,
      render: (get) => get('Planet Emotions.effect') === 'Holographic'
    },
    holoDensity: {
      value: 10,
      min: 2,
      max: 24,
      step: 1,
      render: (get) => get('Planet Emotions.effect') === 'Holographic'
    },
    holoThickness: {
      value: 0.45,
      min: 0.1,
      max: 1,
      step: 0.02,
      render: (get) => get('Planet Emotions.effect') === 'Holographic'
    },
    holoSpeed: {
      value: 1.1,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('Planet Emotions.effect') === 'Holographic'
    }
  });
  return { planetConfig: planetConfig as EmotionVisuals2 };
}
