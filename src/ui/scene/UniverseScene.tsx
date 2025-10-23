import { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Line } from '@react-three/drei';
import { useCurrentEmotion, useUniverseGraph } from '@/state/selectors';
import { ColorEngine } from '@/systems/ColorEngine';

const PRIMARY: string[] = [
  'love',
  'joy',
  'calm',
  'sadness',
  'fear',
  'anger',
  'surprise',
  'nostalgia'
];

const RELATION_ALIAS: Record<string, string> = {
  gratitude: 'love',
  curiosity: 'surprise',
  hope: 'joy',
  anxiety: 'fear',
  pride: 'joy',
  empathy: 'love',
  serenity: 'calm',
  trust: 'calm',
  frustration: 'anger',
  rage: 'anger',
  defense: 'anger',
  memory: 'nostalgia'
};

type Node = {
  label: string;
  pos: THREE.Vector3;
  colorA: string;
  colorB: string;
};

function paletteFor(label: string) {
  const colors = ColorEngine.palette(label);
  return [colors[0] ?? '#ffffff', colors[1] ?? colors[0] ?? '#ffffff'] as [string, string];
}

type PlanetProps = {
  position: THREE.Vector3 | [number, number, number];
  radius: number;
  colorA: string;
  colorB?: string;
  label: string;
  emissiveIntensity?: number;
};

function Planet({ position, radius, colorA, colorB, label, emissiveIntensity = 0.6 }: PlanetProps) {
  const emissive = new THREE.Color(colorB ?? colorA).multiplyScalar(0.6);
  const pos = Array.isArray(position) ? position : position.toArray();
  return (
    <group position={pos as [number, number, number]}>
      <mesh castShadow receiveShadow scale={[radius, radius, radius]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={colorA}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>
      <group position={[0, radius + 0.3, 0]}>
        <Text
          fontSize={Math.max(0.22, radius * 0.3)}
          color={colorA}
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.002}
          outlineColor='#000'
          fillOpacity={0.95}
        >
          {label}
        </Text>
      </group>
    </group>
  );
}

export default function UniverseScene() {
  const current = useCurrentEmotion();
  const graph = useUniverseGraph();

  const AFFECT: Record<string, { valence: number; arousal: number }> = {
    love: { valence: 0.85, arousal: 0.6 },
    joy: { valence: 0.9, arousal: 0.7 },
    calm: { valence: 0.6, arousal: 0.2 },
    sadness: { valence: -0.7, arousal: 0.3 },
    fear: { valence: -0.85, arousal: 0.8 },
    anger: { valence: -0.7, arousal: 0.7 },
    surprise: { valence: 0.2, arousal: 0.9 },
    nostalgia: { valence: 0.2, arousal: 0.4 }
  };

  const spreadX = 7;
  const spreadY = 6;

  const jitterFor = (label: string) => {
    let h = 0;
    for (let i = 0; i < label.length; i++) h = Math.trunc(h * 31 + (label.codePointAt(i) ?? 0));
    return ((h % 1000) / 1000 - 0.5) * 1.2;
  };

  const nodes: Node[] = useMemo(() => {
    const gmap = new Map<string, { valence: number; arousal: number }>();
    for (const n of (graph?.nodes ?? [])) {
      gmap.set(n.label.toLowerCase(), { valence: n.valence, arousal: n.arousal });
    }
    return PRIMARY.map((label) => {
      const [a, b] = paletteFor(label);
      const aff = gmap.get(label) ?? AFFECT[label] ?? { valence: 0, arousal: 0.5 };
      const x = aff.valence * spreadX;
      const y = (aff.arousal - 0.5) * spreadY;
      const z = jitterFor(label);
      return { label, pos: new THREE.Vector3(x, y, z), colorA: a, colorB: b };
    });
  }, [graph?.nodes]);

  const activeSet = useMemo(() => {
    const set = new Set<string>();
    if (current?.label) set.add(current.label.toLowerCase());
    for (const r of (current?.relations ?? [])) {
      const k = (RELATION_ALIAS[r.toLowerCase()] ?? r.toLowerCase()).trim();
      if (PRIMARY.includes(k)) set.add(k);
    }
    return set;
  }, [current?.label, current?.relations]);

  const FALLBACK_EDGES: Array<[string, string]> = [
    ['love', 'joy'],
    ['joy', 'surprise'],
    ['calm', 'nostalgia'],
    ['sadness', 'nostalgia'],
    ['fear', 'anger'],
    ['anger', 'sadness']
  ];

  const weights = useMemo(() => {
    const map = new Map<string, number>();
    const gnodes = graph?.nodes ?? [];
    let maxW = 0;
    for (const n of gnodes) {
      map.set(n.label.toLowerCase(), n.weight);
      if (n.weight > maxW) maxW = n.weight;
    }
    if (maxW > 0) {
      for (const n of gnodes) map.set(n.label.toLowerCase(), n.weight / maxW);
    }
    return map;
  }, [graph?.nodes]);

  const layout = useMemo(() => {
    const items = nodes.map((n) => {
      const isActive = activeSet.has(n.label);
      const w = weights.get(n.label) ?? 0;
  const radius = (0.75 + w * 0.9) * (isActive ? 1.1 : 1);
  const emissiveIntensity = (0.5 + w * 0.9) * (isActive ? 1.1 : 1);
      return {
        label: n.label,
        pos: n.pos.clone(),
        colorA: n.colorA,
        colorB: n.colorB,
        radius,
        emissiveIntensity
      };
    });

    const iterations = 14;
    for (let it = 0; it < iterations; it++) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          const delta = new THREE.Vector3().subVectors(b.pos, a.pos);
          const dist = Math.max(0.0001, delta.length());
          const minDist = a.radius + b.radius + 0.6;
          if (dist < minDist) {
            const push = (minDist - dist) * 0.08;
            const dir = delta.normalize();
            a.pos.addScaledVector(dir, -push);
            b.pos.addScaledVector(dir, push);
          }
        }
      }
    }
    return items;
  }, [nodes, weights, activeSet]);

  const grid = (
    <group>
      <Line points={[new THREE.Vector3(-spreadX, 0, 0), new THREE.Vector3(spreadX, 0, 0)]} color={'#889'} opacity={0.25} transparent lineWidth={1} />
      <Line points={[new THREE.Vector3(0, -spreadY * 0.5, 0), new THREE.Vector3(0, spreadY * 0.5, 0)]} color={'#889'} opacity={0.25} transparent lineWidth={1} />
      {[-0.5, -0.25, 0.25, 0.5].map((t, i) => (
        <Line key={`yt-${i}`} points={[new THREE.Vector3(-0.3, t * spreadY, 0), new THREE.Vector3(0.3, t * spreadY, 0)]} color={'#889'} opacity={0.2} transparent lineWidth={1} />
      ))}
      <Text position={[spreadX + 0.6, 0, 0]} fontSize={0.22} color={'#ccd'} anchorX="left" anchorY="middle">+valence</Text>
      <Text position={[-spreadX - 0.6, 0, 0]} fontSize={0.22} color={'#ccd'} anchorX="right" anchorY="middle">-valence</Text>
      <Text position={[0, spreadY * 0.5 + 0.6, 0]} fontSize={0.22} color={'#ccd'} anchorX="center" anchorY="bottom">high arousal</Text>
      <Text position={[0, -spreadY * 0.5 - 0.6, 0]} fontSize={0.22} color={'#ccd'} anchorX="center" anchorY="top">low arousal</Text>
    </group>
  );

  return (
    <group>
      {grid}
      {(graph?.edges?.length ? graph.edges : FALLBACK_EDGES.map(([a, b]) => ({ source: a, target: b, weight: 1, type: 'semantic' as const }))).map((e, idx) => {
        const a = (e as any).source ?? (e as any)[0];
        const b = (e as any).target ?? (e as any)[1];
        const na = layout.find((n) => n.label === a);
        const nb = layout.find((n) => n.label === b);
        if (!na || !nb) return null;
        const isActive = activeSet.has(a) || activeSet.has(b);
        const type = (e as any).type ?? 'semantic';
        const opacity = isActive ? (type === 'cooccurrence' ? 0.42 : 0.35) : (type === 'cooccurrence' ? 0.22 : 0.16);
        const width = type === 'cooccurrence' ? 1.8 : 1.2;
        return (
          <Line
            key={`edge-${a}-${b}-${idx}`}
            points={[na.pos, nb.pos]}
            color={isActive ? '#ffffff' : na.colorA}
            opacity={opacity}
            transparent
            lineWidth={width}
          />
        );
      })}

      {layout.map((n) => (
        <Planet
          key={`p-${n.label}`}
          position={n.pos}
          radius={n.radius}
          colorA={n.colorA}
          colorB={n.colorB}
          label={n.label}
          emissiveIntensity={n.emissiveIntensity}
        />
      ))}
    </group>
  );
}
