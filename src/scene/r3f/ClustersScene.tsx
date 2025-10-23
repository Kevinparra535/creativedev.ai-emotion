import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { getClusters } from '@/config/emotion-clusters';

export type ClustersLayout = 'centers' | 'affect' | 'arrow';

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
}: Readonly<PlanetProps>) {
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
  return ((r % 1) - 0.5) * 0; // widen depth jitter [-0.6..0.6]
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
    const MAIN_PAD = 1.0; // extra padding between cluster bounding spheres
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
        const ellipse = 0.7; // slightly rounder ring to spread on Y
        const seed = (idx + 1) * Math.PI * 0.27;
        for (let i = 0; i < n; i++) {
          const t = n > 1 ? i / (n - 1) : 0; // 0..1
          const angle = i * ((Math.PI * 2) / n) + seed;
          const w = 0.7 - 0.45 * t; // descending visual weight
          const r = 0.38 + w * 0.42; // satellite radius ~ [0.38..0.8]
          // Base offset in local ring plane
          const ox = Math.cos(angle) * (ringR + 0.35 * Math.sin(i * 1.3));
          const oy = Math.sin(angle) * (ringR * ellipse);
          const oz = jitterZ(i + idx * 7);
          // Tilt the orbital plane for 3D feel
          const tiltX = Math.sin(seed * 1.3) * 0.45; // [-0.45..0.45] rad
          const tiltZ = Math.cos(seed * 0.9) * 0.35; // [-0.35..0.35] rad
          const euler = new THREE.Euler(tiltX, 0, tiltZ, 'XYZ');
          const off = new THREE.Vector3(ox, oy, oz).applyEuler(euler);

          const px = pos.x + off.x;
          const py = pos.y + off.y;
          const pz = layout === 'arrow' ? pos.z /* keep group depth */ : pos.z + off.z;
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
                emissiveIntensity={0.6 + (s.r - 0.38) * 0.6}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
