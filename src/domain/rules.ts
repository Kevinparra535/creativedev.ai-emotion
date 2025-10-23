import type { Emotion } from './emotion';
import type { Link } from './link';

export interface Rule {
  id: string;
  name: string;
  appliesTo(emotion: Emotion, all: Emotion[]): boolean;
  linkify(emotion: Emotion, all: Emotion[]): Link[]; // genera conexiones dinámicas
}

export interface RuleSet {
  id: string;
  rules: Rule[];
}
