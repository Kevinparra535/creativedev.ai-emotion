import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import { getPresetForEmotion } from '@/config/emotion-presets';
import { useEmotionStore } from '@/stores/emotionStore';

type Props = {
  baseColor: string;
  radius: number;
  speed: number;
  size: number;
  phase?: number;
};

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

// Map secondary relation labels to closest primary nodes in our ring
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

function Satellite({ baseColor, radius, speed, size, phase = 0 }: Readonly<Props>) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    ref.current.position.set(x, 0, z);
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.4}
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

export default function UniverseScene() {
  const current = useEmotionStore((s) => s.current);
  // Structure-only exploration mode: hide spheres/planets and show only connections + labels
  const structureOnly = true;

  const nodes: Node[] = useMemo(() => {
    const pos = ringPositions(PRIMARY.length, 7, Math.PI / 8);
    return PRIMARY.map((label, i) => {
      const [a, b] = colorFor(label);
      return { label, pos: pos[i], colorA: a, colorB: b };
    });
  }, []);

  // Helper: lookup node index by label (lowercased)
  const nodeIndexByLabel = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n, i) => map.set(n.label.toLowerCase(), i));
    return map;
  }, [nodes]);

  // Derive dynamics from current emotion
  const activeLabel = current?.label?.toLowerCase();
  const arousal = current?.arousal ?? 0.3; // 0..1
  const valence = current?.valence ?? 0; // -1..1
  const activeColors = current?.colors && current.colors.length > 0 ? current.colors : undefined;
  const intensity = current?.intensity ?? 0.6;

  // Satellite count/speed from arousal
  const satCount = Math.max(2, Math.min(7, Math.round(2 + arousal * 6)));
  const satSpeed = 0.2 + arousal * 0.6;

  // Highlight scale from valence
  const scaleBase = 1 + Math.abs(valence) * 0.6;

  return (
    <group>
      {/* structural: neighbor connections (solid lines) */}
      {nodes.map((n, i) => {
        const next = nodes[(i + 1) % nodes.length];
        const c = n.colorA;
        return (
          <Line
            key={`link-${n.label}`}
            points={[n.pos, next.pos]}
            color={c}
            opacity={0.18}
            transparent
            lineWidth={1}
            dashed={false}
          />
        );
      })}

      {/* structural: opposition connections (dashed across the ring) */}
      {nodes.map((n, i) => {
        const opp = nodes[(i + Math.floor(nodes.length / 2)) % nodes.length];
        const c = n.colorA;
        return (
          <Line
            key={`opp-${n.label}`}
            points={[n.pos, opp.pos]}
            color={c}
            opacity={0.12}
            transparent
            lineWidth={0.75}
            dashed
            dashSize={0.5}
            gapSize={0.35}
          />
        );
      })}

      {/* dynamic: relation lines from active to related labels (if present) */}
      {activeLabel && current?.relations?.length
        ? current.relations
            .map((rel) => rel.toLowerCase())
            .map((rel) => (nodeIndexByLabel.has(rel) ? rel : RELATION_ALIAS[rel]))
            .filter(
              (rel): rel is string =>
                !!rel && nodeIndexByLabel.has(rel) && nodeIndexByLabel.has(activeLabel)
            )
            .map((rel, idx) => {
              const from = nodeIndexByLabel.get(activeLabel!);
              const to = nodeIndexByLabel.get(rel)!;
              if (from == null || to == null) return null;
              const A = nodes[from];
              const B = nodes[to];
              const col = activeColors?.[0] ?? A.colorA;
              return (
                <Line
                  key={`rel-${rel}-${idx}`}
                  points={[A.pos, B.pos]}
                  color={col}
                  opacity={0.6}
                  transparent
                  lineWidth={1.75}
                  dashed={false}
                />
              );
            })
        : null}

      {structureOnly
        ? // labels only (no spheres)
          nodes.map((n) => (
            <group key={`label-${n.label}`} position={n.pos.toArray()}>
              <Text
                fontSize={0.26}
                color={n.colorA}
                anchorX='center'
                anchorY='middle'
                outlineWidth={0.002}
                outlineColor='#000'
                fillOpacity={0.9}
              >
                {n.label}
              </Text>
            </group>
          ))
        : // full planets + satellites
          nodes.map((n) => {
            const isActive =
              activeLabel === n.label || (activeLabel && n.label.includes(activeLabel));
            const scale = isActive ? scaleBase : 1;
            const emissive = isActive ? Math.min(1, 0.45 + intensity * 0.7) : 0.35;
            const color = isActive && activeColors ? (activeColors[0] ?? n.colorA) : n.colorA;
            const secondary =
              isActive && activeColors
                ? (activeColors[1] ?? activeColors[0] ?? n.colorB)
                : n.colorB;
            return (
              <group key={n.label} position={n.pos.toArray()}>
                {/* planet */}
                <mesh scale={scale} castShadow receiveShadow>
                  <sphereGeometry args={[0.85, 48, 48]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={emissive}
                    roughness={0.45}
                    metalness={0.2}
                  />
                </mesh>

                {/* halo */}
                <mesh>
                  <sphereGeometry args={[1.1, 32, 32]} />
                  <meshBasicMaterial color={color} transparent opacity={isActive ? 0.12 : 0.06} />
                </mesh>

                {/* satellites (only on active) */}
                {isActive &&
                  new Array(satCount)
                    .fill(0)
                    .map((_, i) => (
                      <Satellite
                        key={`sat-${i}`}
                        baseColor={secondary}
                        radius={1.6 + i * 0.35}
                        speed={satSpeed * (1 + i * 0.05)}
                        size={0.1 + i * 0.03}
                        phase={i * 0.7}
                      />
                    ))}
              </group>
            );
          })}
    </group>
  );
}
