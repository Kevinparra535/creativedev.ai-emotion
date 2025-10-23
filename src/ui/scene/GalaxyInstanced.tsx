import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useUniverse } from "@/state/universe.store";
import { ColorEngine } from "@/systems/ColorEngine";

export default function GalaxyInstanced() {
  const { emotions, positions } = useUniverse();
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { dummy, colors } = useMemo(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    return { dummy: d, colors: c };
  }, []);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    emotions.forEach((e, i) => {
      const p = positions[e.id] ?? [0,0,0];
      dummy.position.set(p[0], p[1], p[2]);
      dummy.rotation.y += dt * 0.1;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const col = ColorEngine.fromEmotion(e); // THREE.Color
      meshRef.current.setColorAt(i, col);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    (meshRef.current.instanceColor as any).needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, emotions.length]}>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshStandardMaterial roughness={0.4} metalness={0.1} />
    </instancedMesh>
  );
}
