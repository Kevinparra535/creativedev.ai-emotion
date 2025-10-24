import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

import { useUniverse } from '@/state/universe.store';
import { LayoutEngine } from '@/systems/LayoutEngine';

import GalaxyInstanced from './GalaxyInstanced';
import HaloCloud from './HaloCloud';
import { Planet, EnergyPulse } from './objects/Planets';
import { useUIStore } from '@/stores/uiStore';
import { makeArcPoints, gradientColors } from '@/utils/sceneUtils';

export default function UniverseScene() {
  const { emotions, galaxies, positions, setPositions } = useUniverse();
  const thinking = useUIStore((s) => s.thinking);

  // Calcula posiciones
  const computedPositions = useMemo(() => {
    const nodes = LayoutEngine.sphericalVA(emotions, 24);
    const map: Record<string, [number, number, number]> = {};
    nodes.forEach((n) => (map[n.id] = n.position));
    return map;
  }, [emotions]);

  useEffect(() => setPositions(computedPositions), [computedPositions, setPositions]);

  // Compute galaxy centers: average of member positions; fallback to provided centroid
  const galaxyCenters = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const g of galaxies) {
      let sx = 0,
        sy = 0,
        sz = 0,
        n = 0;
      for (const id of g.members) {
        const p = positions[id];
        if (!p) continue;
        sx += p[0];
        sy += p[1];
        sz += p[2];
        n++;
      }
      if (n > 0) map.set(g.id, [sx / n, sy / n, sz / n]);
      else if (g.centroid) map.set(g.id, g.centroid);
      else map.set(g.id, [0, 0, 0]);
    }
    return map;
  }, [galaxies, positions]);

  // Geometry for membership lines (emotion -> galaxy center)
  const membershipGeometry = useMemo(() => {
    const pairs: Array<[[number, number, number], [number, number, number], THREE.Color]> = [];
    for (const g of galaxies) {
      const center = galaxyCenters.get(g.id) ?? [0, 0, 0];
      const col = new THREE.Color(g.colorHex ?? '#88aacc');
      for (const id of g.members) {
        const p = positions[id];
        if (!p) continue;
        pairs.push([p, center, col]);
      }
    }
    const count = pairs.length * 2;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < pairs.length; i++) {
      const [a, b, col] = pairs[i];
      pos.set(a, i * 6);
      pos.set(b, i * 6 + 3);
      colors.set([col.r, col.g, col.b], i * 6);
      colors.set([col.r, col.g, col.b], i * 6 + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [galaxies, galaxyCenters, positions]);

  return (
    <>
      <HaloCloud />
      {/* Emotion nodes */}
      <GalaxyInstanced />

      {/* Galaxy cores styled as Planets (ClustersScene look & feel) */}
      {galaxies.map((g) => {
        const pos = galaxyCenters.get(g.id) ?? [0, 0, 0];
        // Pulse by aggregate intensity of member emotions
        let pulse = 0;
        let w = 0;
        for (const id of g.members) {
          const e = emotions.find((x) => x.id === id);
          if (!e) continue;
          const iw = e.intensity ?? 0.6;
          pulse += iw * Math.max(0.1, e.arousal ?? 0.5);
          w += iw;
        }
        const pulseIntensity = w > 0 ? Math.min(1, pulse / w) : 0.2;
        const radius = Math.max(0.8, Math.min(2.4, 0.9 + g.members.length * 0.06));
        const colorHex = g.colorHex ?? '#88aacc';
        return (
          <group key={g.id}>
            {/* orbit-like ring for visual cohesion */}
            <GalaxyRing center={pos} radius={radius * 2.2} color={colorHex} />
            <Planet
              position={[pos[0], pos[1], pos[2]]}
              colorA={colorHex}
              label={g.name}
              radius={radius}
              emissiveIntensity={0.6}
              interactive={false}
              thinking={thinking}
              pulseIntensity={pulseIntensity}
              targetColorHex={colorHex}
            />
          </group>
        );
      })}
      {/* Membership lines */}
      {galaxies.length > 0 && (
        <lineSegments frustumCulled={false}>
          <bufferGeometry attach='geometry' {...(membershipGeometry as any)} />
          <lineBasicMaterial
            attach='material'
            vertexColors
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </lineSegments>
      )}

      {/* Galaxy-to-galaxy energy arcs aggregated from emotion links */}
      <GalaxyEnergyArcs
        galaxies={galaxies}
        galaxyCenters={galaxyCenters}
      />
    </>
  );
}

function GalaxyRing({
  center,
  radius,
  color
}: Readonly<{ center: [number, number, number]; radius: number; color: string }>) {
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      arr.push(new THREE.Vector3(center[0] + Math.cos(t) * radius, center[1] + Math.sin(t) * radius, center[2]));
    }
    return arr;
  }, [center, radius]);
  return <Line points={points} color={color} lineWidth={0.75} transparent opacity={0.12} depthWrite={false} />;
}

function GalaxyEnergyArcs({
  galaxies,
  galaxyCenters
}: Readonly<{
  galaxies: { id: string; name: string; members: string[]; colorHex?: string }[];
  galaxyCenters: Map<string, [number, number, number]>;
}>) {
  const { links } = useUniverse();
  const layout: 'centers' | 'affect' | 'arrow' = 'centers';

  // map emotion id -> galaxy id
  const emoToGal = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of galaxies) for (const id of g.members) m.set(id, g.id);
    return m;
  }, [galaxies]);

  // aggregate link weights per galaxy pair
  const galLinks = useMemo(() => {
    const map = new Map<string, { a: string; b: string; weight: number }>();
    for (const l of links) {
      const ga = emoToGal.get(l.source);
      const gb = emoToGal.get(l.target);
      if (!ga || !gb || ga === gb) continue;
      const key = ga < gb ? `${ga}|${gb}` : `${gb}|${ga}`;
      const e = map.get(key) ?? { a: ga, b: gb, weight: 0 };
      e.weight += l.weight ?? 0.5;
      map.set(key, e);
    }
    return [...map.values()].sort((x, y) => y.weight - x.weight).slice(0, 12);
  }, [links, emoToGal]);

  return (
    <group>
      {galLinks.map((el, i) => {
        const aPosArr = galaxyCenters.get(el.a) ?? [0, 0, 0];
        const bPosArr = galaxyCenters.get(el.b) ?? [0, 0, 0];
        const aPos = new THREE.Vector3(aPosArr[0], aPosArr[1], aPosArr[2]);
        const bPos = new THREE.Vector3(bPosArr[0], bPosArr[1], bPosArr[2]);
        // curvature & points similar to ClustersScene
        const { points, ctrl } = makeArcPoints(aPos, bPos, 0.25, 72, layout);
        const colA = galaxies.find((g) => g.id === el.a)?.colorHex ?? '#ffffff';
        const colB = galaxies.find((g) => g.id === el.b)?.colorHex ?? '#ffffff';
        const vColors = gradientColors(colA, colB, points.length);
        const opacity = Math.min(0.85, 0.18 + el.weight * 0.25);
        const width = 0.9;
        return (
          <group key={`genergy-${el.a}-${el.b}-${i}`}>
            <Line points={points} vertexColors={vColors} lineWidth={width} transparent opacity={opacity} depthWrite={false} />
            <EnergyPulse a={aPos} b={bPos} ctrl={ctrl} colorA={colA} colorB={colB} speed={0.45} size={0.09} phase={(i * 0.23) % 1} />
            <EnergyPulse a={bPos} b={aPos} ctrl={ctrl} colorA={colB} colorB={colA} speed={0.38} size={0.07} phase={(i * 0.41) % 1} />
          </group>
        );
      })}
    </group>
  );
}
