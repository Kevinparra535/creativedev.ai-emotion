import { useControls, button, monitor } from 'leva';
import { getPresetForEmotion } from '@/config/emotion-presets';
import { hexToHsl } from '@/utils/color';
import type { Emotion } from '@/domain/emotion';

export type LevaValues = {
  style: string;
  intensity: number;
  speed: number;
  noise: number;
  grain: number;
};

export const useEmotionLeva = (
  emotion: Emotion | null,
  reading: boolean,
  analyzing: boolean
): LevaValues => {
  // Derive transparency info
  const explanation = emotion
    ? `Elegimos "${emotion.label}" por el tono general (valence ${emotion.valence.toFixed(2)}, arousal ${emotion.arousal.toFixed(2)}).`
    : 'Escribe algo para analizar tu tono.';

  const tags = (() => {
    if (!emotion) return [] as string[];
    const t: string[] = [];
    if (emotion.valence > 0.55) t.push('euforia');
    if (emotion.valence > 0.2 && emotion.arousal < 0.4) t.push('calma');
    if (emotion.arousal > 0.65 && emotion.valence < 0) t.push('tensión');
    if (emotion.label) t.push(emotion.label);
    return Array.from(new Set(t));
  })();

  const paletteHsl = (() => {
    const colors = getPresetForEmotion(emotion?.label).colors;
    return colors
      .map((hex) => {
        const hsl = hexToHsl(hex);
        return hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : hex;
      })
      .join('  |  ');
  })();

  // Primary visual controls
  const { style, intensity, speed, noise, grain } = useControls('Emotion Visuals', {
    style: {
      label: 'Style',
      value: 'Minimal',
      options: ['Minimal', 'Dreamy', 'Cyber', 'Nature', 'Memphis', 'Glitch']
    },
    intensity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    speed: { value: 0.5, min: 0, max: 1, step: 0.01 },
    noise: { value: 0.2, min: 0, max: 1, step: 0.01 },
    grain: { value: 0.12, min: 0, max: 1, step: 0.01 }
  });

  // Actions bound to current values
  useControls(
    'Actions',
    {
      Save: button(() => {
        try {
          const key = `preset:${Date.now()}`;
          const data = { style, intensity, speed, noise, grain, emotion };
          localStorage.setItem(key, JSON.stringify(data));
          alert('Preset guardado');
        } catch (err) {
          console.warn('Failed to save preset', err);
        }
      }),
      Share: button(() => {
        const url = new URL(location.href);
        url.searchParams.set('style', String(style));
        url.searchParams.set('intensity', String(intensity));
        url.searchParams.set('speed', String(speed));
        url.searchParams.set('noise', String(noise));
        url.searchParams.set('grain', String(grain));
        if (emotion?.label) url.searchParams.set('label', emotion.label);
        navigator.clipboard.writeText(url.toString());
        alert('Link copiado al portapapeles');
      })
    },
    [style, intensity, speed, noise, grain, emotion]
  );

  // Transparency (read-only monitors), updates on deps changes
  useControls(
    'Transparency',
    () => ({
      Loading: monitor(() => reading || analyzing),
      Explanation: monitor(() => explanation),
      Tags: monitor(() => (tags.length ? tags.join(', ') : '—')),
      PaletteHSL: monitor(() => paletteHsl)
    }),
    [reading, analyzing, explanation, paletteHsl, tags.join('|')]
  );

  return { style, intensity, speed, noise, grain };
};
