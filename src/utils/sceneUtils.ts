import * as THREE from 'three';

import type { ClusterDef } from '@/config/emotion-clusters';
import { clusterToEmotion } from '@/config/emotion-clusters';

import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import { RuleEngine } from '@/systems/RuleEngine';
import { EnergyRules } from '@/systems/rules/EnergyRules';

export type ClustersLayout = 'centers' | 'affect' | 'arrow';

export function makeOrbitPoints(
  center: THREE.Vector3,
  a: number,
  e: number,
  theta: number,
  euler: THREE.Euler,
  layout: ClustersLayout,
  segments = 96
) {
  const pts: THREE.Vector3[] = [];
  const b = a * Math.sqrt(Math.max(0, 1 - e * e));
  const c = a * e;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  for (let s = 0; s <= segments; s++) {
    const t = (s / segments) * Math.PI * 2;
    const ex = a * Math.cos(t) + c;
    const ey = b * Math.sin(t);
    const rx = ex * cosT - ey * sinT;
    const ry = ex * sinT + ey * cosT;
    const local = new THREE.Vector3(rx, ry, 0);
    if (layout !== 'arrow') local.applyEuler(euler);
    const x = center.x + local.x;
    const y = center.y + local.y;
    const z = layout === 'arrow' ? center.z : center.z + local.z;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

export function computeArcControlPoint(
  a: THREE.Vector3,
  b: THREE.Vector3,
  curvature = 0.28,
  layout: ClustersLayout
) {
  const dir = new THREE.Vector3().copy(b).sub(a);
  const dist = Math.max(1e-4, dir.length());
  const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const ctrl = new THREE.Vector3().copy(mid).addScaledVector(perp, curvature * dist);
  if (layout !== 'arrow') ctrl.z += 0.15;
  return ctrl;
}

export function makeArcPoints(
  a: THREE.Vector3,
  b: THREE.Vector3,
  curvature = 0.28,
  segments = 72,
  layout: ClustersLayout = 'centers'
) {
  const ctrl = computeArcControlPoint(a, b, curvature, layout);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const one = 1 - t;
    const p = new THREE.Vector3()
      .copy(a)
      .multiplyScalar(one * one)
      .add(new THREE.Vector3().copy(ctrl).multiplyScalar(2 * one * t))
      .add(new THREE.Vector3().copy(b).multiplyScalar(t * t));
    pts.push(p);
  }
  return { points: pts, ctrl };
}

export function linkWidthForKind(kind: Link['kind']): number {
  switch (kind) {
    case 'polarity':
      return 1.8;
    case 'transition':
      return 1.5;
    case 'cause':
      return 1.3;
    case 'function':
      return 1.4;
    default:
      return 1.4;
  }
}

export function gradientColors(hexA: string, hexB: string, count: number): THREE.Color[] {
  const ca = new THREE.Color(hexA);
  const cb = new THREE.Color(hexB);
  const arr: THREE.Color[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1);
    const c = ca.clone().lerp(cb, t);
    arr.push(c);
  }
  return arr;
}

export function relaxMainPositions(
  bases: THREE.Vector3[],
  boundRadii: number[],
  layout: ClustersLayout,
  centerScale = 3
) {
  const arr = bases.map((v) => v.clone().multiplyScalar(centerScale));
  const MAIN_PAD = 1;
  const MAIN_ITERS = 28;

  if (layout !== 'arrow') {
    const N = arr.length;
    const ringDepth = 20;
    const phi = Math.PI * 2;
    for (let i = 0; i < N; i++) {
      const ang = (i / Math.max(1, N)) * Math.PI * 2 + phi;
      arr[i].z += Math.cos(ang) * ringDepth;
    }
  }

  for (let it = 0; it < MAIN_ITERS; it++) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (layout === 'arrow') {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          const minDist = boundRadii[i] + boundRadii[j] + MAIN_PAD;
          if (d < minDist) {
            const push = (minDist - d) * 0.12;
            const nx = dx / d;
            const ny = dy / d;
            a.x += nx * (push * 0.5);
            a.y += ny * (push * 0.5);
            b.x -= nx * (push * 0.5);
            b.y -= ny * (push * 0.5);
          }
        } else {
          const delta = new THREE.Vector3().subVectors(a, b);
          const dist = Math.max(0.0001, delta.length());
          const minDist = boundRadii[i] + boundRadii[j] + MAIN_PAD;
          if (dist < minDist) {
            const push = (minDist - dist) * 0.12;
            const dir = delta.divideScalar(dist);
            a.addScaledVector(dir, push * 0.5);
            b.addScaledVector(dir, -push * 0.5);
          }
        }
      }
    }
  }
  return arr;
}

export type EnergyLinkAgg = {
  aIndex: number;
  bIndex: number;
  kind: Link['kind'];
  weight: number;
  colA: string;
  colB: string;
};

export function computePrimaryEnergyLinks(clusters: ClusterDef[]): EnergyLinkAgg[] {
  const primaries: Emotion[] = clusters.map((c) => clusterToEmotion(c));
  const links = new RuleEngine({ id: 'energies', rules: EnergyRules }).apply(primaries);

  const idxById = new Map<string, number>();
  for (let i = 0; i < clusters.length; i++) idxById.set(clusters[i].key, i);

  type Agg = { aIndex: number; bIndex: number; kind: Link['kind']; weight: number };
  const acc = new Map<string, Agg>();
  for (const l of links) {
    const ai = idxById.get(l.source);
    const bi = idxById.get(l.target);
    if (ai === undefined || bi === undefined) continue;
    const a = Math.min(ai, bi);
    const b = Math.max(ai, bi);
    const key = `${l.kind}|${a}|${b}`;
    const cur = acc.get(key);
    if (cur) cur.weight = Math.min(1, cur.weight + l.weight * 0.5);
    else acc.set(key, { aIndex: a, bIndex: b, kind: l.kind, weight: Math.min(1, l.weight) });
  }

  const out: EnergyLinkAgg[] = [];
  for (const v of acc.values()) {
    const colA = clusters[v.aIndex].colors[0] ?? '#93C5FD';
    const colB = clusters[v.bIndex].colors[0] ?? '#93C5FD';
    out.push({ ...v, colA, colB });
  }
  return out;
}

export function jitterZ(seed: number) {
  const r = Math.sin(seed * 12.9898) * 43758.5453;
  return ((r % 1) - 0.5) * 0; // widen depth jitter [-0.6..0.6]
}
