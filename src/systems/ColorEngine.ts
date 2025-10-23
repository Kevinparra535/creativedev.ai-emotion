import * as THREE from 'three';

import { getPresetForEmotion } from '@/config/emotion-presets';
import type { Emotion } from '@/domain/emotion';

export const ColorEngine = {
  palette(label?: string | null) {
    return getPresetForEmotion(label).colors;
  },

  fromEmotion(emotion: Emotion): THREE.Color {
    const colors = this.palette(emotion.label);
    return colors.length > 0 ? new THREE.Color(colors[0]) : new THREE.Color(0xffffff);
  }
};
