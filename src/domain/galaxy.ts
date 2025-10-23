import type { ClustersLayout } from './emotion';

export type ClusterKey =
  | 'love'
  | 'joy'
  | 'calm'
  | 'sadness'
  | 'fear'
  | 'anger'
  | 'surprise'
  | 'nostalgia';

export type UniverseNode = {
  label: string;
  weight: number;
  valence: number;
  arousal: number;
  colors?: string[];
};

export type UniverseEdge = {
  source: string;
  target: string;
  weight: number;
  type: 'cooccurrence' | 'semantic';
};

export type UniverseGraph = {
  nodes: UniverseNode[];
  edges: UniverseEdge[];
  summary: { valence: number; arousal: number };
};

export type LayoutKind = ClustersLayout;
