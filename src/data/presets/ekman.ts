import { getPresetForEmotion } from '@/config/emotion-presets';

export const EKMAN_BASIC = [
  'joy',
  'sadness',
  'fear',
  'anger',
  'surprise',
  'disgust'
] as const;

export function ekmanPalette(label: string): string[] {
  const preset = getPresetForEmotion(label);
  return preset.colors;
}
