import { useMemo } from 'react';
import * as THREE from 'three';
import { useUniverse } from '@/state/universe.store';

export default function LinksInstanced() {
  const { links, positions } = useUniverse();

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = Math.max(0, links.length) * 2;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      const a = positions[l.source] ?? [0, 0, 0];
      const b = positions[l.target] ?? [0, 0, 0];
      pos.set(a, i * 6);
      pos.set(b, i * 6 + 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
    return { geometry: geo, material: mat };
  }, [links, positions]);

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}
