import { useMemo } from 'react';
import * as THREE from 'three';

export default function HaloCloud({ count = 800, radius = 50 }: Readonly<{ count?: number; radius?: number }>) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // random points in a spherical shell
      const r = radius * (0.85 + Math.random() * 0.25);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions.set([x, y, z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ size: 0.15, color: 0x99aacc, transparent: true, opacity: 0.4 });
    return { geometry: geo, material: mat };
  }, [count, radius]);

  return <points geometry={geometry} material={material} frustumCulled />;
}
