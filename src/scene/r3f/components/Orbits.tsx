import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Planet, type PlanetProps } from '../objects/Planets';
import type { ClustersLayout } from '@/utils/sceneUtils';

export function OrbitLine({
  points,
  color,
  opacityFactor = 1
}: Readonly<{ points: THREE.Vector3[]; color: string; opacityFactor?: number }>) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.25 * Math.max(0, Math.min(1, opacityFactor))}
      depthWrite={false}
    />
  );
}

export type OrbitingSatelliteProps = {
  center: THREE.Vector3;
  a: number; // semi-major axis
  e: number; // eccentricity
  theta: number; // in-plane rotation
  euler: THREE.Euler; // plane tilt
  layout: ClustersLayout;
  phase0: number; // initial phase
  speed: number; // radians per second (parametric)
  introZOffset?: number; // additional z offset for intro
  introScale?: number; // scale-in for intro
  planet: Omit<PlanetProps, 'position'>;
};

export function OrbitingSatellite({
  center,
  a,
  e,
  theta,
  euler,
  layout,
  phase0,
  speed,
  introZOffset = 0,
  introScale = 1,
  planet
}: Readonly<OrbitingSatelliteProps>) {
  const groupRef = useRef<THREE.Group>(null);
  // Precompute constants to avoid per-frame allocations
  const b = useMemo(() => a * Math.sqrt(Math.max(0, 1 - e * e)), [a, e]);
  const cosT = useMemo(() => Math.cos(theta), [theta]);
  const sinT = useMemo(() => Math.sin(theta), [theta]);

  const tRef = useRef(phase0);

  useFrame((_, delta) => {
    tRef.current += speed * delta;
    const t = tRef.current;
    // Parametric ellipse with focus offset c = a*e
    const cF = a * e;
    const ex = a * Math.cos(t) + cF;
    const ey = b * Math.sin(t);
    // In-plane rotation
    const rx = ex * cosT - ey * sinT;
    const ry = ex * sinT + ey * cosT;
    // Local vector in orbit plane
    const local = new THREE.Vector3(rx, ry, 0);
    if (layout !== 'arrow') local.applyEuler(euler);
    const px = center.x + local.x;
    const py = center.y + local.y;
    let pz = layout === 'arrow' ? center.z : center.z + local.z;
    pz += introZOffset;
    if (groupRef.current) {
      groupRef.current.position.set(px, py, pz);
      groupRef.current.scale.setScalar(introScale);
      groupRef.current.visible = introScale > 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <Planet {...planet} position={[0, 0, 0]} />
    </group>
  );
}
