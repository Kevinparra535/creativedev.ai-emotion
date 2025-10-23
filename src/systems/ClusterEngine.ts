import type { Emotion } from '@/domain/emotion';
import type { Galaxy } from '@/domain/galaxy';
import { getClusters, clusterKeyForLabel } from '@/config/emotion-clusters';

export type AffectDefaults = Record<string, { valence: number; arousal: number; colors?: string[] }>

// Centralized affect defaults (label -> valence/arousal/colors), includes synonyms
export function buildAffectDefaults(): AffectDefaults {
  const map: AffectDefaults = Object.create(null);
  const clusters = getClusters();
  for (const c of clusters) {
    map[c.key] = { valence: c.valence, arousal: c.arousal, colors: c.colors };
    map[c.label.toLowerCase()] = { valence: c.valence, arousal: c.arousal, colors: c.colors };
    for (const s of c.synonyms ?? []) {
      map[s.toLowerCase()] = { valence: c.valence, arousal: c.arousal, colors: c.colors };
    }
  }
  return map;
}

export const AFFECT_DEFAULTS: AffectDefaults = buildAffectDefaults();

export function mapLabelToPrimary(label: string): string | null {
  return clusterKeyForLabel(label);
}

// Group emotions by primary clusters using cluster definitions and label mapping
export function clusterByPrimaries(emotions: Emotion[]): Galaxy[] {
  const clusters = getClusters();
  const buckets = new Map<string, string[]>();
  for (const c of clusters) buckets.set(c.key, []);

  for (const e of emotions) {
    const key = mapLabelToPrimary(e.label);
    if (!key) continue;
    const list = buckets.get(key);
    if (list) list.push(e.id);
  }

  const galaxies: Galaxy[] = [];
  for (const c of clusters) {
    const members = buckets.get(c.key) ?? [];
    if (!members.length) continue;
    galaxies.push({
      id: `g-${c.key}`,
      name: c.label,
      members,
      centroid: c.center,
      radius: c.radius,
      colorHex: c.colors[0]
    });
  }
  return galaxies;
}
