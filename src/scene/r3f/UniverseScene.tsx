import { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Line } from '@react-three/drei';
import { getPresetForEmotion } from '@/config/emotion-presets';
import { useEmotionStore } from '@/stores/emotionStore';
import { useUniverseStore } from '@/stores/universeStore';

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

// Map secondary relation labels to closest primary nodes
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

function colorFor(label: string) {
  const preset = getPresetForEmotion(label);
  return [preset.colors[0] ?? '#ffffff', preset.colors[1] ?? preset.colors[0] ?? '#ffffff'] as [
    string,
    string
  ];
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
  // Simple material: base color + subtle emissive tint
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
  const current = useEmotionStore((s) => s.current);
  const graph = useUniverseStore((s) => s.graph);

  // Affect defaults for primaries (valence [-1..1], arousal [0..1])
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
    for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0;
    return ((h % 1000) / 1000 - 0.5) * 1.2; // ~[-0.6..0.6]
  };

  const nodes: Node[] = useMemo(() => {
    return PRIMARY.map((label) => {
      const [a, b] = colorFor(label);
      const aff = AFFECT[label] ?? { valence: 0, arousal: 0.5 };
      const x = aff.valence * spreadX;
      const y = (aff.arousal - 0.5) * spreadY;
      const z = jitterFor(label);
      return { label, pos: new THREE.Vector3(x, y, z), colorA: a, colorB: b };
    });
  }, []);

  // Active set = current label + its relations mapped to primaries (for stronger glow)
  const activeSet = useMemo(() => {
    const set = new Set<string>();
    if (current?.label) set.add(current.label.toLowerCase());
    (current?.relations ?? []).forEach((r) => {
      const k = (RELATION_ALIAS[r.toLowerCase()] ?? r.toLowerCase()).trim();
      if (PRIMARY.includes(k)) set.add(k);
    });
    return set;
  }, [current?.label, current?.relations]);

  // Semantic edges between primaries (soft connectivity)
  const EDGES: Array<[string, string]> = [
    ['love', 'joy'],
    ['joy', 'surprise'],
    ['calm', 'nostalgia'],
    ['sadness', 'nostalgia'],
    ['fear', 'anger'],
    ['anger', 'sadness']
  ];

  // Optional weight map from graph to modulate size/brightness
  const weights = useMemo(() => {
    const map = new Map<string, number>();
    const nodes = graph?.nodes ?? [];
    let maxW = 0;
    nodes.forEach((n) => {
      map.set(n.label.toLowerCase(), n.weight);
      if (n.weight > maxW) maxW = n.weight;
    });
    // normalize to [0..1]
    if (maxW > 0) {
      nodes.forEach((n) => map.set(n.label.toLowerCase(), n.weight / maxW));
    }
    return map;
  }, [graph?.nodes]);

  return (
    <group>
      {/* Edges */}
      {EDGES.map(([a, b]) => {
        const na = nodes.find((n) => n.label === a);
        const nb = nodes.find((n) => n.label === b);
        if (!na || !nb) return null;
        const isActive = activeSet.has(a) || activeSet.has(b);
        return (
          <Line
            key={`edge-${a}-${b}`}
            points={[na.pos, nb.pos]}
            color={isActive ? '#ffffff' : na.colorA}
            opacity={isActive ? 0.35 : 0.16}
            transparent
            lineWidth={isActive ? 1.5 : 1}
          />
        );
      })}

      {/* Planets */}
      {nodes.map((n) => {
        const isActive = activeSet.has(n.label);
        const w = weights.get(n.label) ?? 0;
        const radius = (0.75 + w * 0.9) * (isActive ? 1.1 : 1.0);
        const emissiveIntensity = (0.5 + w * 0.9) * (isActive ? 1.1 : 1.0);
        return (
          <Planet
            key={`p-${n.label}`}
            position={n.pos}
            radius={radius}
            colorA={n.colorA}
            colorB={n.colorB}
            label={n.label}
            emissiveIntensity={emissiveIntensity}
          />
        );
      })}
    </group>
  );
}
