import * as THREE from 'three';

import { getPresetForEmotion } from '@/config/emotion-presets';

import type { Emotion } from '@/domain/emotion';

export const ColorEngine = {
  palette(label?: string | null) {
    return getPresetForEmotion(label).colors;
  },

  fromEmotion(emotion: Emotion): THREE.Color {
    const colors = this.palette(emotion.label);
    if (colors.length > 0) {
      const colorString = colors[0];
      // Convert rgba to rgb to avoid THREE.Color alpha warning
      const rgbColor = colorString.replace(/rgba?\(([^)]+)\)/, (_m, values) => {
        const [r, g, b] = values.split(',').map((v: string) => v.trim());
        return `rgb(${r}, ${g}, ${b})`;
      });
      return new THREE.Color(rgbColor);
    }
    return new THREE.Color(0xffffff);
  }
};
