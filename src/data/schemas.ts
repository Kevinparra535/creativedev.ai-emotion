// Lightweight TS-only "schemas" for adapter parsing

export type OpenAIEmotionJSON = {
  emotions?: Array<{
    label?: string;
    weight?: number;
    score?: number;
    valence?: number;
    arousal?: number;
    colors?: string[];
    color?: string[];
    intensity?: number;
  }>;
  global?: { valence?: number; arousal?: number };
  pairs?: [string, string][];
};
