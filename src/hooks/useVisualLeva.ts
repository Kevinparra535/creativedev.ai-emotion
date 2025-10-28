import { useControls } from 'leva';

export type VisualPostSettings = {
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  noiseEnabled: boolean;
  noiseOpacity: number;
  vignetteEnabled: boolean;
  vignetteOffset: number;
  vignetteDarkness: number;
  chromaEnabled: boolean;
  chromaOffset: number; // small offset [0..0.01]
};

export function useVisualLeva(): { post: VisualPostSettings } {
  const post = useControls('Visuals / Post', {
    bloomEnabled: { value: true },
    bloomIntensity: {
      value: 0.8,
      min: 0,
      max: 2,
      step: 0.05,
      render: (get) => get('bloomEnabled')
    },
    bloomThreshold: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => get('bloomEnabled')
    },
    bloomSmoothing: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => get('bloomEnabled')
    },
    noiseEnabled: { value: true },
    noiseOpacity: {
      value: 0.02,
      min: 0,
      max: 0.1,
      step: 0.005,
      render: (get) => get('noiseEnabled')
    },
    vignetteEnabled: { value: true },
    vignetteOffset: {
      value: 0.1,
      min: 0,
      max: 0.5,
      step: 0.01,
      render: (get) => get('vignetteEnabled')
    },
    vignetteDarkness: {
      value: 1.1,
      min: 0.2,
      max: 2,
      step: 0.05,
      render: (get) => get('vignetteEnabled')
    },
    chromaEnabled: { value: false },
    chromaOffset: {
      value: 0.0015,
      min: 0,
      max: 0.01,
      step: 0.0005,
      render: (get) => get('chromaEnabled')
    }
  });

  return { post: post as VisualPostSettings };
}
