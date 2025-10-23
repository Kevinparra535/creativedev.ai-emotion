import * as THREE from 'three';
import type { Layout } from '@/domain/layout';
import { getClusters } from '@/config/emotion-clusters';

export function basePositions(layout: Layout) {
  const clusters = getClusters();
  const spreadX = 7.5;
  const spreadY = 6.8;
  if (layout === 'centers') return clusters.map((c) => new THREE.Vector3(...c.center));
  if (layout === 'affect')
    return clusters.map((c) => new THREE.Vector3(c.valence * spreadX, (c.arousal - 0.5) * spreadY, 0));
  // arrow
  const map = new Map<string, THREE.Vector3>();
  const X = 6, Y = 6, tip = 1.4, ZG = 2.5;
  map.set('love', new THREE.Vector3(0, Y + tip, +ZG));
  map.set('calm', new THREE.Vector3(-X, Y, +ZG));
  map.set('joy', new THREE.Vector3(+X, Y, +ZG));
  map.set('nostalgia', new THREE.Vector3(-X * 0.6, 0, 0));
  map.set('surprise', new THREE.Vector3(+X * 0.6, 0, 0));
  map.set('anger', new THREE.Vector3(0, -Y - tip, -ZG));
  map.set('sadness', new THREE.Vector3(-X, -Y, -ZG));
  map.set('fear', new THREE.Vector3(+X, -Y, -ZG));
  return clusters.map((c) => map.get(c.key) ?? new THREE.Vector3());
}
