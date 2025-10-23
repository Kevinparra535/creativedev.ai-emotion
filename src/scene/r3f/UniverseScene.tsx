import { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Line } from '@react-three/drei';
import { getPresetForEmotion } from '@/config/emotion-presets';
import { useEmotionStore } from '@/stores/emotionStore';

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

function ringPositions(count: number, radius = 6, phase = 0) {
  return new Array(count).fill(0).map((_, i) => {
    const t = (i / count) * Math.PI * 2 + phase;
    return new THREE.Vector3(
      Math.cos(t) * radius,
      Math.sin(t) * radius * 0.4,
      Math.sin(t) * radius * 0.2
    );
  });
}

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
};

function Planet({ position, radius, colorA, colorB, label }: PlanetProps) {
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

  // Helper ring for layout
  const primaryRing: Node[] = useMemo(() => {
    const pos = ringPositions(PRIMARY.length, 7, Math.PI / 8);
    return PRIMARY.map((label, i) => {
      const [a, b] = colorFor(label);
      return { label, pos: pos[i], colorA: a, colorB: b };
    });
  }, []);

  // If there is an active emotion, render a central big planet and a ring of related planets (no connections)
  if (current?.label) {
    const label = current.label.toLowerCase();
    const colors = current.colors?.length ? current.colors : getPresetForEmotion(label).colors;
    const colorA = colors[0] ?? '#ffffff';
    const colorB = colors[1] ?? colorA;
    const intensity = THREE.MathUtils.clamp(current.intensity ?? current.score ?? 0.6, 0, 1);
    const arousal = THREE.MathUtils.clamp(current.arousal ?? 0.3, 0, 1);

    // Center planet size scales with intensity/score
    const centerRadius = 0.8 + intensity * 1.4; // 0.8 .. 2.2

    // Related emotions as smaller planets, scaled by order (no weights available)
    const relationLabels = (current.relations ?? [])
      .map((r) => r?.toLowerCase())
      .filter(Boolean)
      .map((rel) => RELATION_ALIAS[rel!] ?? rel!)
      .filter((rel) => rel !== label);

    const ringR = 5 + arousal * 2; // layout radius
    const ringPos = ringPositions(Math.max(1, relationLabels.length), ringR, Math.PI / 6);

    return (
      <group>
        {/* Central big planet */}
        <Planet
          position={[0, 0, 0]}
          radius={centerRadius}
          colorA={colorA}
          colorB={colorB}
          label={label}
        />

        {/* Ring planets (no connections) */}
        {relationLabels.map((rel, i) => {
          const p = ringPos[i] ?? new THREE.Vector3(ringR, 0, 0);
          const [ra, rb] = colorFor(rel);
          // scale down with index so earlier relations appear larger
          const t = relationLabels.length > 1 ? i / (relationLabels.length - 1) : 1;
          const relScale = 0.45 + (1 - t) * 0.55; // 0.45 .. 1.0
          const base = 0.38 + intensity * 0.6; // 0.38 .. 0.98
          const radius = base * relScale;
          return (
            <Planet
              key={`rel-${rel}-${i}`}
              position={p}
              radius={radius}
              colorA={ra}
              colorB={rb}
              label={rel}
            />
          );
        })}
      </group>
    );
  }

  primaryRing.map((n, i) => {
    const next = primaryRing[(i + 1) % primaryRing.length];
    return (
      <Line
        key={`plink-${n.label}`}
        points={[n.pos, next.pos]}
        color={n.colorA}
        opacity={0.18}
        transparent
        lineWidth={1}
      />
    );
  });

  primaryRing.map((n, i) => {
    const radius = 0.6 + 0.25 * Math.sin((i / primaryRing.length) * Math.PI * 2);
    return (
      <Planet
        key={`p-${n.label}`}
        position={n.pos}
        radius={radius}
        colorA={n.colorA}
        colorB={n.colorB}
        label={n.label}
      />
    );
  });
  return (
    <group>
      {primaryRing.map((n, i) => {
        const radius = 0.6 + 0.25 * Math.sin((i / primaryRing.length) * Math.PI * 2);
        return (
          <Planet
            key={`p-${n.label}`}
            position={n.pos}
            radius={radius}
            colorA={n.colorA}
            colorB={n.colorB}
            label={n.label}
          />
        );
      })}
    </group>
  );
}
