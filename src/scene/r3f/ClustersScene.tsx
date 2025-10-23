import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { getClusters } from '@/config/emotion-clusters';

export type ClustersLayout = 'centers' | 'affect';

type PlanetProps = {
  position: THREE.Vector3 | [number, number, number];
  colorA: string;
  colorB?: string;
  label: string;
  radius?: number;
  emissiveIntensity?: number;
};

function Planet({
  position,
  colorA,
  colorB,
  label,
  radius = 0.9,
  emissiveIntensity = 0.75
}: PlanetProps) {
  const pos = Array.isArray(position) ? position : position.toArray();
  const emissive = new THREE.Color(colorB ?? colorA);
  return (
    <group position={pos as [number, number, number]}>
      <mesh castShadow receiveShadow scale={[radius, radius, radius]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={colorA}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.45}
          metalness={0.06}
        />
      </mesh>
      {/* halo */}
      <mesh>
        <sphereGeometry args={[radius * 1.25, 32, 32]} />
        <meshBasicMaterial color={colorA} transparent opacity={0.12} />
      </mesh>
      {/* label */}
      <group position={[0, radius + 0.36, 0]}>
        <Text
          fontSize={Math.max(0.22, radius * 0.34)}
          color={colorA}
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.002}
          outlineColor='#000'
        >
          {label}
        </Text>
      </group>
    </group>
  );
}

function jitterZ(seed: number) {
  const r = Math.sin(seed * 12.9898) * 43758.5453;
  return ((r % 1) - 0.5) * 0.8; // [-0.4..0.4]
}

export default function ClustersScene({ layout = 'centers' as ClustersLayout }) {
  const clusters = useMemo(() => getClusters(), []);

  const spreadX = 6.5;
  const spreadY = 6.0;

  return (
    <group>
      {clusters.map((c, idx) => {
        const colorA = c.colors[0] ?? '#ffffff';
        const colorB = c.colors[1] ?? colorA;
        const radius = 0.95 + (c.radius - 2.5) * 0.15; // normalize visual size from cluster radius

        const pos =
          layout === 'centers'
            ? new THREE.Vector3(c.center[0], c.center[1], c.center[2])
            : new THREE.Vector3(c.valence * spreadX, (c.arousal - 0.5) * spreadY, jitterZ(idx));

        return (
          <Planet
            key={c.key}
            position={pos}
            colorA={colorA}
            colorB={colorB}
            label={c.label}
            radius={radius}
          />
        );
      })}
    </group>
  );
}
