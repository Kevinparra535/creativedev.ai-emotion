import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useUniverse } from '@/state/universe.store';
import { ColorEngine } from '@/systems/ColorEngine';

export default function GalaxyInstanced() {
  const { emotions, positions } = useUniverse();
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { dummy } = useMemo(() => {
    return { dummy: new THREE.Object3D() };
  }, []);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < emotions.length; i++) {
      const e = emotions[i];
      const p = positions[e.id] ?? [0, 0, 0];
      dummy.position.set(p[0], p[1], p[2]);
      dummy.rotation.y += dt * 0.15;
      const scale = 0.6 + (e.intensity ?? 0.5) * 0.7;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const col = ColorEngine.fromEmotion(e);
      if (mesh.instanceColor) mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) (mesh.instanceColor as any).needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, emotions.length]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial roughness={0.45} metalness={0.1} />
    </instancedMesh>
  );
}
