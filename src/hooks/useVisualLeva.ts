import { useControls } from 'leva';

export type VisualSettings = {
  nebula: {
    enabled: boolean;
    opacity: number; // 0..1 cap
    intensityGain: number; // 0..1 multiplier on shader intensity
    speed: number; // time multiplier
    scale: number; // base fbm scale
  };
  post: {
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
};

export function useVisualLeva(): VisualSettings {
  const nebula = useControls('Visuals / Nebula', {
    enabled: { value: true },
    opacity: { value: 0.22, min: 0, max: 0.6, step: 0.01 },
    intensityGain: { value: 0.9, min: 0, max: 2, step: 0.05 },
    speed: { value: 1, min: 0, max: 2, step: 0.05 },
    scale: { value: 1, min: 0.2, max: 3, step: 0.05 }
  });

  const post = useControls('Visuals / Post', {
    bloomEnabled: { value: true },
    bloomIntensity: { value: 0.8, min: 0, max: 2, step: 0.05 },
    bloomThreshold: { value: 0.0, min: 0, max: 1, step: 0.01 },
    bloomSmoothing: { value: 0.9, min: 0, max: 1, step: 0.01 },
    noiseEnabled: { value: true },
    noiseOpacity: { value: 0.02, min: 0, max: 0.1, step: 0.005 },
    vignetteEnabled: { value: true },
    vignetteOffset: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
    vignetteDarkness: { value: 1.1, min: 0.2, max: 2, step: 0.05 },
    chromaEnabled: { value: false },
    chromaOffset: { value: 0.0015, min: 0, max: 0.01, step: 0.0005 }
  });

  return { nebula: nebula as VisualSettings['nebula'], post: post as VisualSettings['post'] };
}
