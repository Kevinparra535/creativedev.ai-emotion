import { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useUniverse } from '@/state/universe.store';

export default function LinksInstanced() {
  const { links, positions } = useUniverse();
  const { gl } = useThree();

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(links.length * 2 * 3);
    links.forEach((l, i) => {
      const a = positions[l.source] ?? [0, 0, 0];
      const b = positions[l.target] ?? [0, 0, 0];
      pos.set(a, i * 6);
      pos.set(b, i * 6 + 3);
    });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [links, positions]);

  const mat = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4 }), []);
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}
