import * as THREE from 'three';

export function hashLabel(label: string) {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    const cp = label.codePointAt(i) ?? 0;
    h = Math.trunc(h * 31 + cp);
  }
  return h >>> 0;
}

export function jitter(label: string, scale = 1) {
  const h = hashLabel(label);
  return ((h % 1000) / 1000 - 0.5) * scale;
}

export function vec3(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}
