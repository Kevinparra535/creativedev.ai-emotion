import { getPresetForEmotion } from '@/config/emotion-presets';

export const ColorEngine = {
  palette(label?: string | null) {
    return getPresetForEmotion(label).colors;
  }
};
