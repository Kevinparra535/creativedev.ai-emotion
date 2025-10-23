// Domain types for emotions and analysis results

export type EmotionResponse = {
  label: string;
  score: number;
  valence: number; // [-1..1]
  arousal: number; // [0..1]
  colors: string[];
  intensity: number; // [0..1]
  relations: string[];
};

export type MultiEmotionItem = {
  label: string;
  weight: number; // [0..1]
  valence?: number;
  arousal?: number;
  colors?: string[];
  intensity?: number;
};

export type MultiEmotionResult = {
  emotions: MultiEmotionItem[];
  global?: { valence?: number; arousal?: number };
  pairs?: [string, string][];
};

// Layout primitive used across scenes
export type ClustersLayout = 'centers' | 'affect' | 'arrow';
