import * as THREE from 'three';

export function simpleRelax(positions: THREE.Vector3[], radii: number[], iters = 12, pad = 0.6) {
  const P = positions;
  const R = radii;
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < P.length; i++) {
      for (let j = i + 1; j < P.length; j++) {
        const a = P[i];
        const b = P[j];
        const delta = new THREE.Vector3().subVectors(b, a);
        const dist = Math.max(0.0001, delta.length());
        const minDist = R[i] + R[j] + pad;
        if (dist < minDist) {
          const push = (minDist - dist) * 0.08;
          const dir = delta.normalize();
          a.addScaledVector(dir, -push);
          b.addScaledVector(dir, push);
        }
      }
    }
  }
}
