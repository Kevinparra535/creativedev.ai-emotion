import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type Props = {
  name?: string;
  color?: string | number;
  position?: [number, number, number];
};

const EmotionCluster = ({ name, color, position }: Props) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.2;
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={0.6} color={color} />
      </mesh>

      {/* Halo energético */}
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

export default EmotionCluster;
