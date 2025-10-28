import { useControls } from 'leva';

export type BlendQuality = 'Low' | 'Medium' | 'High';

export function useBlendLeva(): { quality: BlendQuality; segments: number; sharpness: number } {
  const controls = useControls('Visuals / Blend Planet', {
    quality: {
      value: 'Medium' as BlendQuality,
      options: {
        Low: 'Low',
        Medium: 'Medium',
        High: 'High'
      }
    }
  }) as { quality: BlendQuality };

  const { quality } = controls;

  const segments = quality === 'High' ? 192 : quality === 'Low' ? 96 : 128;
  const sharpness = quality === 'High' ? 2.6 : quality === 'Low' ? 1.9 : 2.2;

  return { quality, segments, sharpness };
}
