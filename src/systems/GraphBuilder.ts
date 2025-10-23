import { type Emotion } from '@/domain/emotion';
import type { Galaxy } from '@/domain/galaxy';
import type { Link } from '@/domain/link';

export interface Graph {
  emotions: Emotion[];
  galaxies: Galaxy[];
  links: Link[];
}

export class GraphBuilder {
  static clusterByValence(emotions: Emotion[]): Galaxy[] {
    // ejemplo sencillo: 3 galaxias por valencia
    const neg = emotions.filter((e) => e.valence < -0.25).map((e) => e.id);
    const neu = emotions.filter((e) => Math.abs(e.valence) <= 0.25).map((e) => e.id);
    const pos = emotions.filter((e) => e.valence > 0.25).map((e) => e.id);
    return [
      { id: 'g-neg', name: 'Negativa', members: neg, colorHex: '#4B6CB7' },
      { id: 'g-neu', name: 'Neutra', members: neu, colorHex: '#8892B0' },
      { id: 'g-pos', name: 'Positiva', members: pos, colorHex: '#FFB703' }
    ];
  }

  static mergeLinks(...lists: Link[]): Link[] {
    const map = new Map<string, Link>();
    lists.flat().forEach((l) => {
      const key = [l.source, l.target, l.kind].join('|');
      const existing = map.get(key);
      if (existing) existing.weight = Math.min(1, existing.weight + l.weight * 0.5);
      else map.set(key, { ...l });
    });
    return [...map.values()];
  }
}
