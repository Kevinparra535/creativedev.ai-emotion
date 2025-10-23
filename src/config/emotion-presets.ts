export type VisualPreset = {
  colors: string[]; // gradient stops
  motion: 'expand' | 'sway' | 'fall' | 'tremble' | 'pulse' | 'recoil' | 'neutral';
  particles: 'dense-up' | 'few-float' | 'drops' | 'spikes' | 'sparks' | 'grain' | 'none';
};

const PRESETS: Record<string, VisualPreset> = {
  // Alegría / Joy
  alegria: { colors: ['#FFD166', '#FF7A59'], motion: 'expand', particles: 'dense-up' },
  joy: { colors: ['#FFD166', '#FF7A59'], motion: 'expand', particles: 'dense-up' },

  // Calma / Calm
  calma: { colors: ['#7AD7F0', '#A7E9AF'], motion: 'sway', particles: 'few-float' },
  calm: { colors: ['#7AD7F0', '#A7E9AF'], motion: 'sway', particles: 'few-float' },

  // Tristeza / Sadness
  tristeza: { colors: ['#6B7A8F', '#3A506B'], motion: 'fall', particles: 'drops' },
  sadness: { colors: ['#6B7A8F', '#3A506B'], motion: 'fall', particles: 'drops' },

  // Miedo / Fear
  miedo: { colors: ['#0E3B43', '#1B2A41'], motion: 'tremble', particles: 'spikes' },
  fear: { colors: ['#0E3B43', '#1B2A41'], motion: 'tremble', particles: 'spikes' },

  // Enojo / Anger
  enojo: { colors: ['#D7263D', '#8B0000'], motion: 'pulse', particles: 'sparks' },
  anger: { colors: ['#D7263D', '#8B0000'], motion: 'pulse', particles: 'sparks' },

  // Nostalgia
  nostalgia: { colors: ['#C2A878', '#7E6B5A'], motion: 'recoil', particles: 'grain' },

  // Neutral/default
  neutral: { colors: ['rgba(85, 98, 112, 0)', 'rgba(78, 205, 197, 0)'], motion: 'neutral', particles: 'none' }
};

export function getPresetForEmotion(label?: string | null): VisualPreset {
  if (!label) return PRESETS.neutral;
  const key = label.trim().toLowerCase();
  return PRESETS[key] ?? PRESETS.neutral;
}
