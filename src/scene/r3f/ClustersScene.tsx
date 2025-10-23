import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Text, useCursor, Line } from '@react-three/drei';
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
    // Custom 'arrow' layout: 3 positives up (arrow ↑), 3 negatives down (arrow ↓), neutrals mid
    // Fixed grid for clarity; aligned depths per group
    const map = new Map<string, THREE.Vector3>();
    const X = 6; // horizontal spacing
    const Y = 6; // vertical spacing base
    const tip = 1.4; // tip offset to shape an arrow
    const ZG = 2.5; // per-group depth
    // Positives (up): love (tip), calm (left), joy (right)
    map.set('love', new THREE.Vector3(0, Y + tip, +ZG));
    map.set('calm', new THREE.Vector3(-X, Y, +ZG));
    map.set('joy', new THREE.Vector3(+X, Y, +ZG));
    // Neutrals (mid): nostalgia (left-mid), surprise (right-mid)
    map.set('nostalgia', new THREE.Vector3(-X * 0.6, 0, 0));
    map.set('surprise', new THREE.Vector3(+X * 0.6, 0, 0));
    // Negatives (down): anger (tip), sadness (left), fear (right)
    map.set('anger', new THREE.Vector3(0, -Y - tip, -ZG));
    map.set('sadness', new THREE.Vector3(-X, -Y, -ZG));
    map.set('fear', new THREE.Vector3(+X, -Y, -ZG));

    return clusters.map((c) => map.get(c.key) ?? new THREE.Vector3());
  }, [clusters, layout]);

  // Main radii for each cluster (used in relaxation)
  const mainRadii = useMemo(() => clusters.map((c) => 0.95 + (c.radius - 2.5) * 0.15), [clusters]);

  // Satellite ring radii per cluster (keep in sync with ringR used below)
  const ringRadii = useMemo(() => clusters.map((c) => c.radius * 1.85), [clusters]);

  // Bounding radii per cluster for non-overlap (main planet + ring + max satellite + margin)
  const boundRadii = useMemo(
    () => clusters.map((_, i) => mainRadii[i] + ringRadii[i] + 0.9 /* max sat/halo + margin */),
    [clusters, mainRadii, ringRadii]
  );

  // Relax main planets (x,y) to avoid overlaps between clusters
  const mainPositions = useMemo(() => {
    const arr = bases.map((v) => v.clone().multiplyScalar(CENTER_SCALE));
    const MAIN_PAD = 1; // extra padding between cluster bounding spheres
    const MAIN_ITERS = 28;

    if (layout !== 'arrow') {
      // For non-arrow layouts, add ring-like depth distribution for variety
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
            // Constrain relaxation to X/Y to keep group Z planes intact
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

        // Use relaxed main position
        const pos = mainPositions[idx].clone();

        // Generate satellites around the main cluster planet (variation A)
        const satLabels: string[] = (
          c.synonyms && c.synonyms.length ? c.synonyms : ['s1', 's2', 's3', 's4', 's5', 's6']
        ).slice(0, 8);

        const n = satLabels.length;

        const items: {
          label: string;
          pos: THREE.Vector3;
          r: number;
          colorA: string;
          colorB: string;
          fixed?: boolean;
        }[] = [];

        // Add main planet as fixed item for collision constraints
        items.push({
          label: c.label,
          pos: pos.clone(),
          r: mainRadius,
          colorA,
          colorB,
          fixed: true
        });

        const ringR = ringRadii[idx]; // increased orbital radius for satellites
  // Note: ellipse aspect now derived from eccentricity per satellite
        const seed = (idx + 1) * Math.PI * 0.27;
  // Base cluster tilt (used as mean plane)
  const tiltX = Math.sin(seed * 1.3) * 0.45; // [-0.45..0.45] rad
  const tiltZ = Math.cos(seed * 0.9) * 0.35; // [-0.35..0.35] rad
  const baseEuler = new THREE.Euler(tiltX, 0, tiltZ, 'XYZ');

        // Precompute orbit lines (one per satellite)
        const orbitPointsList: THREE.Vector3[][] = [];
        for (let i = 0; i < n; i++) {
          const tNorm = n > 1 ? i / (n - 1) : 0; // 0..1
          const angle = i * ((Math.PI * 2) / n) + seed; // use as phase reference
          const w = 0.7 - 0.45 * tNorm; // descending visual weight
          const r = 0.38 + w * 0.42; // satellite visual size ~ [0.38..0.8]

          // Realistic orbital parameters per satellite
          const a = ringR * (0.85 + 0.25 * tNorm); // semi-major grows with order
          const eccSeed = Math.sin((i + 1) * 1.318 + idx * 0.7) * 0.5 + 0.5; // [0..1]
          const e = 0.05 + 0.2 * eccSeed; // eccentricity ~ [0.05..0.25]
          const theta = (seed * 0.6 + i * 0.9) % (Math.PI * 2); // in-plane rotation

          // Per-satellite plane variation (small inclination deltas around base)
          const maxInc = 0.35; // ~20°
          const incX = (Math.sin(i * 2.13 + idx * 0.77) * 0.5) * maxInc;
          const incZ = (Math.cos(i * 1.73 + idx * 0.41) * 0.5) * maxInc;
          const eulerSat = layout === 'arrow'
            ? baseEuler
            : new THREE.Euler(baseEuler.x + incX * 0.6, 0, baseEuler.z + incZ * 0.6, 'XYZ');

          // Build orbit line with this satellite plane
          orbitPointsList.push(makeOrbitPoints(pos, a, e, theta, eulerSat, layout));

          // Place satellite on its orbit at phase 'angle'
          const b = a * Math.sqrt(Math.max(0, 1 - e * e));
          const cF = a * e;
          const ex = a * Math.cos(angle) + cF;
          const ey = b * Math.sin(angle);
          const cosT = Math.cos(theta), sinT = Math.sin(theta);
          const rx = ex * cosT - ey * sinT;
          const ry = ex * sinT + ey * cosT;
          const local = new THREE.Vector3(rx, ry, 0);
          if (layout !== 'arrow') local.applyEuler(eulerSat);
          const px = pos.x + local.x;
          const py = pos.y + local.y;
          const pz = layout === 'arrow' ? pos.z : pos.z + local.z;
          items.push({
            label: satLabels[i],
            pos: new THREE.Vector3(px, py, pz),
            r,
            colorA,
            colorB
          });
        }

        // Relaxation to avoid overlaps (only move satellites, keep main fixed)
        const padSat = 0.38; // satellite-satellite padding
        const padMain = 0.6; // main-satellite extra padding
        const iters = 18;
        for (let it = 0; it < iters; it++) {
          for (let i = 1; i < items.length; i++) {
            for (let j = 0; j < items.length; j++) {
              if (i === j) continue;
              const a = items[i];
              const b = items[j];
              const delta = new THREE.Vector3().subVectors(a.pos, b.pos);
              const dist = Math.max(0.0001, delta.length());
              const minDist = a.r + b.r + (j === 0 || b.fixed ? padMain : padSat);
              if (dist < minDist) {
                const dir = delta.normalize();
                const push = (minDist - dist) * 0.12; // softness
                if (j === 0 || b.fixed) {
                  // push only the satellite away from main (fixed)
                  a.pos.addScaledVector(dir, push);
                } else {
                  // split push between satellites
                  a.pos.addScaledVector(dir, push * 0.5);
                  b.pos.addScaledVector(dir, -push * 0.5);
                }
              }
            }
          }
        }

        return (
          <group key={c.key}>
            {/* Orbits (one per satellite) */}
            {orbitPointsList.map((pts, oi) => (
              <OrbitLine key={`${c.key}-orbit-${oi}`} points={pts} color={colorA} />
            ))}
            {/* Main planet */}
            <Planet
              position={pos}
              colorA={colorA}
              colorB={colorB}
              label={c.label}
              radius={mainRadius}
            />
            {/* Satellites */}
            {items.slice(1).map((s, si) => (
              <Planet
                key={`${c.key}-sat-${si}`}
                position={s.pos}
                colorA={s.colorA}
                colorB={s.colorB}
                label={s.label}
                radius={s.r}
                emissiveIntensity={0.25 + (s.r - 0.38) * 0.35} // lower base glow for satellites
                hoverEmissive={0.9 + (s.r - 0.38) * 0.7} // bright on hover
                interactive
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
