import { getPresetForEmotion } from '@/config/emotion-presets';

export const PLUTCHIK_PRIMARY = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation'
] as const;

export function plutchikPalette(label: string): string[] {
  const preset = getPresetForEmotion(label);
  return preset.colors;
}
