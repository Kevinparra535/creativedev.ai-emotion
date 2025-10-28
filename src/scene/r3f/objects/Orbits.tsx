import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Planet, type PlanetProps, PrimaryBlendPlanet } from '../objects/Planets';
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

export type BlendOrbitingSatelliteProps = {
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
  blend: {
    colors: string[];
    label: string;
    radius: number;
    segments: number;
    sharpness: number;
    spinSpeed: number;
    intensity: number;
    // EV2 effect params
    effect: 'Watercolor' | 'Oil' | 'Link' | 'Holographic';
    wcWash: number;
    wcScale: number;
    wcFlow: number;
    wcSharpness: number;
    oilSwirl: number;
    oilScale: number;
    oilFlow: number;
    oilShine: number;
    oilContrast: number;
    // Link effect params
    linkDensity: number;
    linkThickness: number;
    linkNoise: number;
    linkFlow: number;
    linkContrast: number;
    // Holographic effect params
    holoIntensity: number;
    holoFresnel: number;
    holoDensity: number;
    holoThickness: number;
    holoSpeed: number;
  };
};

export function BlendOrbitingSatellite({
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
  blend
}: Readonly<BlendOrbitingSatelliteProps>) {
  const groupRef = useRef<THREE.Group>(null);
  const b = useMemo(() => a * Math.sqrt(Math.max(0, 1 - e * e)), [a, e]);
  const cosT = useMemo(() => Math.cos(theta), [theta]);
  const sinT = useMemo(() => Math.sin(theta), [theta]);
  const tRef = useRef(phase0);

  useFrame((_, delta) => {
    tRef.current += speed * delta;
    const t = tRef.current;
    const cF = a * e;
    const ex = a * Math.cos(t) + cF;
    const ey = b * Math.sin(t);
    const rx = ex * cosT - ey * sinT;
    const ry = ex * sinT + ey * cosT;
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
      <PrimaryBlendPlanet
        key={`blend-sat-planet-${blend.label}-${blend.effect}-${blend.segments}-${blend.sharpness}-${blend.colors.join('-')}`}
        position={[0, 0, 0]}
        colors={blend.colors}
        label={blend.label}
        radius={blend.radius}
        segments={blend.segments}
        sharpness={blend.sharpness}
        spinSpeed={blend.spinSpeed}
        intensity={blend.intensity}
        effect={blend.effect}
        wcWash={blend.wcWash}
        wcScale={blend.wcScale}
        wcFlow={blend.wcFlow}
        wcSharpness={blend.wcSharpness}
        oilSwirl={blend.oilSwirl}
        oilScale={blend.oilScale}
        oilFlow={blend.oilFlow}
        oilShine={blend.oilShine}
        oilContrast={blend.oilContrast}
        linkDensity={blend.linkDensity}
        linkThickness={blend.linkThickness}
        linkNoise={blend.linkNoise}
        linkFlow={blend.linkFlow}
        linkContrast={blend.linkContrast}
        holoIntensity={blend.holoIntensity}
        holoFresnel={blend.holoFresnel}
        holoDensity={blend.holoDensity}
        holoThickness={blend.holoThickness}
        holoSpeed={blend.holoSpeed}
        interactive={false}
      />
    </group>
  );
}
