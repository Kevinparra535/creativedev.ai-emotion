// Primary emotion clusters: each is a "galaxy" with a main planet
// Keep this minimal and composable; rendering layers can import from here.

export type ClusterKey =
  | 'love'
  | 'joy'
  | 'calm'
  | 'sadness'
  | 'fear'
  | 'anger'
  | 'surprise'
  | 'nostalgia';

export type ClusterDef = {
  key: ClusterKey;
  label: string; // display label
  // Affective defaults (used for layout or fallback when model data is missing)
  valence: number; // [-1, 1]
  arousal: number; // [0, 1]
  // Visual identity
  colors: string[]; // main palette (first = base color)
  radius: number; // typical cluster spread (for placing satellites)
  // Suggested galaxy center position (non-binding; scene can remap)
  center: [number, number, number]; // [x, y, z]
  // Synonyms/aliases that map to this cluster
  synonyms?: string[];
};

// Base palettes are aligned with emotion-presets to keep app-wide consistency
const CLUSTERS: Record<ClusterKey, ClusterDef> = {
  love: {
    key: 'love',
    label: 'Love',
    valence: 0.85,
    arousal: 0.6,
    colors: ['#FF6FAE', '#FF3D67'],
    radius: 2.8,
    center: [4.8, 1.8, 0.3],
    synonyms: ['affection', 'cariño', 'caring', 'compassion']
  },
  joy: {
    key: 'joy',
    label: 'Joy',
    valence: 0.9,
    arousal: 0.7,
    colors: ['#FFD166', '#FF7A59'],
    radius: 2.6,
    center: [5.8, 2.6, -0.2],
    synonyms: ['happiness', 'alegría', 'delight', 'pleasure', 'gratitude']
  },
  calm: {
    key: 'calm',
    label: 'Calm',
    valence: 0.6,
    arousal: 0.2,
    colors: ['#7AD7F0', '#A7E9AF'],
    radius: 2.5,
    center: [2.8, -2.2, 0.2],
    synonyms: ['serenity', 'tranquility', 'trust', 'peace']
  },
  sadness: {
    key: 'sadness',
    label: 'Sadness',
    valence: -0.7,
    arousal: 0.3,
    colors: ['#6B7A8F', '#3A506B'],
    radius: 2.7,
    center: [-4.2, -1.6, -0.3],
    synonyms: ['grief', 'melancholy', 'loneliness', 'pena', 'decepción']
  },
  fear: {
    key: 'fear',
    label: 'Fear',
    valence: -0.85,
    arousal: 0.8,
    colors: ['#0E3B43', '#1B2A41'],
    radius: 2.9,
    center: [-5.8, 2.8, 0.4],
    synonyms: ['anxiety', 'worry', 'insecurity', 'panic']
  },
  anger: {
    key: 'anger',
    label: 'Anger',
    valence: -0.7,
    arousal: 0.7,
    colors: ['#D7263D', '#8B0000'],
    radius: 2.9,
    center: [-5.0, 1.2, -0.2],
    synonyms: ['frustration', 'rage', 'resentment', 'irritation']
  },
  surprise: {
    key: 'surprise',
    label: 'Surprise',
    valence: 0.2,
    arousal: 0.9,
    colors: ['#FFE66D', '#9B5DE5'],
    radius: 2.4,
    center: [0.8, 3.4, -0.1],
    synonyms: ['astonishment', 'wonder', 'curiosity']
  },
  nostalgia: {
    key: 'nostalgia',
    label: 'Nostalgia',
    valence: 0.2,
    arousal: 0.4,
    colors: ['#C2A878', '#7E6B5A'],
    radius: 2.6,
    center: [-1.2, -0.8, 0.25],
    synonyms: ['melancholy', 'memory', 'recuerdo']
  }
};

// Export helpers
export function getClusters(): ClusterDef[] {
  return Object.values(CLUSTERS);
}

export function getCluster(key: ClusterKey): ClusterDef {
  return CLUSTERS[key];
}

// Map any label to a cluster key, using synonyms and a few direct mappings
const LABEL_TO_CLUSTER: Record<string, ClusterKey> = (() => {
  const map: Record<string, ClusterKey> = Object.create(null);
  for (const c of Object.values(CLUSTERS)) {
    map[c.key] = c.key;
    map[c.label.toLowerCase()] = c.key;
    for (const s of c.synonyms ?? []) map[s.toLowerCase()] = c.key;
  }
  // Handy direct aliases
  map['alegria'] = 'joy';
  map['amor'] = 'love';
  map['calma'] = 'calm';
  map['tristeza'] = 'sadness';
  map['miedo'] = 'fear';
  map['enojo'] = 'anger';
  map['sorpresa'] = 'surprise';
  return map;
})();

export function clusterKeyForLabel(label: string): ClusterKey | null {
  const k = LABEL_TO_CLUSTER[label.trim().toLowerCase()];
  return (k as ClusterKey) ?? null;
}
