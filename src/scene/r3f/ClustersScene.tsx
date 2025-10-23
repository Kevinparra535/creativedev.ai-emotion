import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Text, useCursor, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getClusters } from '@/config/emotion-clusters';

export type ClustersLayout = 'centers' | 'affect' | 'arrow';

type PlanetProps = {
  position: THREE.Vector3 | [number, number, number];
  colorA: string;
  colorB?: string;
  label: string;
  radius?: number;
  emissiveIntensity?: number;
  interactive?: boolean;
  hoverEmissive?: number; // optional emissive intensity when hovered
};

function Planet({
  position,
  colorA,
  colorB,
  label,
  radius = 1,
  emissiveIntensity = 0.75,
  interactive = true,
  hoverEmissive
}: Readonly<PlanetProps>) {
  const pos = Array.isArray(position) ? position : position.toArray();
  const emissive = new THREE.Color(colorB ?? colorA);
  const [hovered, setHovered] = useState<boolean>(false);
  useCursor(interactive && hovered);

  const effEmissive =
    hovered && interactive ? (hoverEmissive ?? emissiveIntensity * 1.6) : emissiveIntensity;

  return (
    <group
      position={pos}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(true);
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(false);
            }
          : undefined
      }
    >
      <mesh castShadow receiveShadow scale={[radius, radius, radius]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={colorA}
          emissive={emissive}
          emissiveIntensity={effEmissive}
          roughness={0.45}
          metalness={0.06}
        />
        <meshPhysicalMaterial
          roughness={0}
          color={colorA}
          emissive={emissive || colorA}
          envMapIntensity={0.2}
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
  return ((r % 1) - 0.5) * 0; // widen depth jitter [-0.6..0.6]
}

function makeOrbitPoints(
  center: THREE.Vector3,
  a: number, // semi-major axis
  e: number, // eccentricity [0..1)
  theta: number, // in-plane rotation (argument of periapsis)
  euler: THREE.Euler, // plane tilt (ignored for 'arrow')
  layout: ClustersLayout,
  segments = 96
) {
  const pts: THREE.Vector3[] = [];
  const b = a * Math.sqrt(Math.max(0, 1 - e * e));
  const c = a * e; // focus distance
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  for (let s = 0; s <= segments; s++) {
    const t = (s / segments) * Math.PI * 2;
    // Ellipse around its center at (c, 0) so the focus is at origin
    const ex = a * Math.cos(t) + c;
    const ey = b * Math.sin(t);
    // In-plane rotation by theta
    const rx = ex * cosT - ey * sinT;
    const ry = ex * sinT + ey * cosT;
    const local = new THREE.Vector3(rx, ry, 0);
    if (layout !== 'arrow') local.applyEuler(euler);
    const x = center.x + local.x;
    const y = center.y + local.y;
    const z = layout === 'arrow' ? center.z : center.z + local.z;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

function OrbitLine({ points, color }: Readonly<{ points: THREE.Vector3[]; color: string }>) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.25}
      depthWrite={false}
    />
  );
}

type OrbitingSatelliteProps = {
  center: THREE.Vector3;
  a: number; // semi-major axis
  e: number; // eccentricity
  theta: number; // in-plane rotation
  euler: THREE.Euler; // plane tilt
  layout: ClustersLayout;
  phase0: number; // initial phase
  speed: number; // radians per second (parametric)
  planet: Omit<PlanetProps, 'position'>;
};

function OrbitingSatellite({
  center,
  a,
  e,
  theta,
  euler,
  layout,
  phase0,
  speed,
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
    const pz = layout === 'arrow' ? center.z : center.z + local.z;
    if (groupRef.current) groupRef.current.position.set(px, py, pz);
  });

  return (
    <group ref={groupRef}>
      <Planet {...planet} position={[0, 0, 0]} />
    </group>
  );
}

export default function ClustersScene(props: Readonly<{ layout?: ClustersLayout }>) {
  const { layout = 'centers' } = props;
  const clusters = useMemo(() => getClusters(), []);

  // Layout spreads for 'affect' mapping
  const spreadX = 7.5; // slightly larger to reduce collisions on affect layout
  const spreadY = 6.8;

  // Global main-planets spacing multiplier (applies to both layouts)
  const CENTER_SCALE = 3; // increase distance between cluster centers

  // Precompute base positions per layout
  const bases = useMemo(() => {
    if (layout === 'centers') {
      return clusters.map((c) => new THREE.Vector3(c.center[0], c.center[1], c.center[2]));
    }
    if (layout === 'affect') {
      return clusters.map(
        (c, idx) =>
          new THREE.Vector3(c.valence * spreadX, (c.arousal - 0.5) * spreadY, jitterZ(idx))
      );
    }
    // Custom 'arrow' layout
    const map = new Map<string, THREE.Vector3>();
    const X = 6;
    const Y = 6;
    const tip = 1.4;
    const ZG = 2.5;
    // Positives (up)
    map.set('love', new THREE.Vector3(0, Y + tip, +ZG));
    map.set('calm', new THREE.Vector3(-X, Y, +ZG));
    map.set('joy', new THREE.Vector3(+X, Y, +ZG));
    // Neutrals (mid)
    map.set('nostalgia', new THREE.Vector3(-X * 0.6, 0, 0));
    map.set('surprise', new THREE.Vector3(+X * 0.6, 0, 0));
    // Negatives (down)
    map.set('anger', new THREE.Vector3(0, -Y - tip, -ZG));
    map.set('sadness', new THREE.Vector3(-X, -Y, -ZG));
    map.set('fear', new THREE.Vector3(+X, -Y, -ZG));

    return clusters.map((c) => map.get(c.key) ?? new THREE.Vector3());
  }, [clusters, layout]);

  // Main radii for each cluster
  const mainRadii = useMemo(() => clusters.map((c) => 0.95 + (c.radius - 2.5) * 0.15), [clusters]);
  // Satellite ring radii per cluster
  const ringRadii = useMemo(() => clusters.map((c) => c.radius * 1.85), [clusters]);
  // Bounding radii per cluster for non-overlap
  const boundRadii = useMemo(
    () => clusters.map((_, i) => mainRadii[i] + ringRadii[i] + 0.9),
    [clusters, mainRadii, ringRadii]
  );

  // Relax main planets to avoid overlaps between clusters
  const mainPositions = useMemo(() => {
    const arr = bases.map((v) => v.clone().multiplyScalar(CENTER_SCALE));
    const MAIN_PAD = 1;
    const MAIN_ITERS = 28;

    if (layout !== 'arrow') {
      const N = arr.length;
      const ringDepth = 20;
      const phi = Math.PI * 2;
      for (let i = 0; i < N; i++) {
        const ang = (i / Math.max(1, N)) * Math.PI * 2 + phi;
        arr[i].z += Math.cos(ang) * ringDepth;
      }
    }

    for (let it = 0; it < MAIN_ITERS; it++) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i];
          const b = arr[j];
          if (layout === 'arrow') {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d = Math.hypot(dx, dy) || 0.0001;
            const minDist = boundRadii[i] + boundRadii[j] + MAIN_PAD;
            if (d < minDist) {
              const push = (minDist - d) * 0.12;
              const nx = dx / d;
              const ny = dy / d;
              a.x += nx * (push * 0.5);
              a.y += ny * (push * 0.5);
              b.x -= nx * (push * 0.5);
              b.y -= ny * (push * 0.5);
            }
          } else {
            const delta = new THREE.Vector3().subVectors(a, b);
            const dist = Math.max(0.0001, delta.length());
            const minDist = boundRadii[i] + boundRadii[j] + MAIN_PAD;
            if (dist < minDist) {
              const push = (minDist - dist) * 0.12;
              const dir = delta.divideScalar(dist);
              a.addScaledVector(dir, push * 0.5);
              b.addScaledVector(dir, -push * 0.5);
            }
          }
        }
      }
    }
    return arr;
  }, [bases, boundRadii, layout]);

  return (
    <group>
      {clusters.map((c, idx) => {
        const colorA = c.colors[0] ?? '#ffffff';
        const colorB = c.colors[1] ?? colorA;
        const mainRadius = mainRadii[idx];

        const pos = mainPositions[idx].clone();

        const satLabels: string[] = (
          c.synonyms && c.synonyms.length ? c.synonyms : ['s1', 's2', 's3', 's4', 's5', 's6']
        ).slice(0, 8);
        const n = satLabels.length;

        const ringR = ringRadii[idx];
        const seed = (idx + 1) * Math.PI * 0.27;
        const tiltX = Math.sin(seed * 1.3) * 0.45;
        const tiltZ = Math.cos(seed * 0.9) * 0.35;
        const baseEuler = new THREE.Euler(tiltX, 0, tiltZ, 'XYZ');

        const orbitPointsList: THREE.Vector3[][] = [];
        const satellites: Array<{
          label: string;
          a: number;
          e: number;
          theta: number;
          euler: THREE.Euler;
          phase0: number;
          r: number;
          colorA: string;
          colorB: string;
        }> = [];

        for (let i = 0; i < n; i++) {
          const tNorm = n > 1 ? i / (n - 1) : 0;
          const angle = i * ((Math.PI * 2) / n) + seed;
          const w = 0.7 - 0.45 * tNorm;
          const r = 0.38 + w * 0.42;

          const a = ringR * (0.85 + 0.25 * tNorm);
          const eccSeed = Math.sin((i + 1) * 1.318 + idx * 0.7) * 0.5 + 0.5;
          const e = 0.05 + 0.2 * eccSeed;
          const theta = (seed * 0.6 + i * 0.9) % (Math.PI * 2);

          const maxInc = 0.35;
          const incX = Math.sin(i * 2.13 + idx * 0.77) * 0.5 * maxInc;
          const incZ = Math.cos(i * 1.73 + idx * 0.41) * 0.5 * maxInc;
          const eulerSat =
            layout === 'arrow'
              ? baseEuler
              : new THREE.Euler(baseEuler.x + incX * 0.6, 0, baseEuler.z + incZ * 0.6, 'XYZ');

          orbitPointsList.push(makeOrbitPoints(pos, a, e, theta, eulerSat, layout));

          satellites.push({
            label: satLabels[i],
            a,
            e,
            theta,
            euler: eulerSat,
            phase0: angle,
            r,
            colorA,
            colorB
          });
        }

        return (
          <group key={c.key}>
            {orbitPointsList.map((pts, oi) => (
              <OrbitLine key={`${c.key}-orbit-${oi}`} points={pts} color={colorA} />
            ))}

            <Planet
              position={pos}
              colorA={colorA}
              colorB={colorB}
              label={c.label}
              radius={mainRadius}
            />

            {satellites.map((s, si) => (
              <OrbitingSatellite
                key={`${c.key}-sat-${si}`}
                center={pos}
                a={s.a}
                e={s.e}
                theta={s.theta}
                euler={s.euler}
                layout={layout}
                phase0={s.phase0}
                speed={0.08 + 0.015 * Math.sin((si + 1) * 1.234 + idx * 0.77)}
                planet={{
                  colorA: s.colorA,
                  colorB: s.colorB,
                  label: s.label,
                  radius: s.r,
                  emissiveIntensity: 0.25 + (s.r - 0.38) * 0.35,
                  hoverEmissive: 0.9 + (s.r - 0.38) * 0.7,
                  interactive: true
                }}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
