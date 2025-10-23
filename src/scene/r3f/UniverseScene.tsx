import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import { getPresetForEmotion } from '@/config/emotion-presets';
import { useEmotionStore } from '@/stores/emotionStore';

// Note: satellites/planets are disabled in structure-only mode

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

// Note: Satellite component removed in structure-only mode to avoid unused code

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

  // Derive current emotion basics
  const activeLabel = current?.label?.toLowerCase();
  const activeColors = current?.colors && current.colors.length > 0 ? current.colors : undefined;
  const arousal = current?.arousal ?? 0.3;
  // Sequential reveal centered on the strongest emotion
  const [stage, setStage] = useState(0); // 0: center only, 1: add first ring
  useEffect(() => {
    setStage(0);
    const id = setTimeout(() => setStage(1), 450);
    return () => clearTimeout(id);
  }, [activeLabel]);

  // If we have an active emotion, render centered layout with concentric ring for its relations
  if (structureOnly && activeLabel) {
    const centerColor = activeColors?.[0] ?? getPresetForEmotion(activeLabel).colors[0] ?? '#fff';
    const relationLabels = (current?.relations ?? [])
      .map((r) => r.toLowerCase())
      .map((rel) => (nodeIndexByLabel.has(rel) ? rel : (RELATION_ALIAS[rel] ?? rel)))
      .filter((rel) => rel && rel !== activeLabel);

    const radius = 5 + arousal * 2; // scale by arousal
    const positions = ringPositions(relationLabels.length || 1, radius, Math.PI / 6);

    return (
      <group>
        {/* center label */}
        <group position={[0, 0, 0]}>
          <Text
            fontSize={0.34}
            color={centerColor}
            anchorX='center'
            anchorY='middle'
            outlineWidth={0.002}
            outlineColor='#000'
            fillOpacity={0.95}
          >
            {activeLabel}
          </Text>
        </group>

        {/* concentric ring (stage >= 1) */}
        {stage >= 1 &&
          relationLabels.map((rel, i) => {
            const p = positions[i] ?? new THREE.Vector3(radius, 0, 0);
            const col = getPresetForEmotion(rel).colors[0] ?? centerColor;
            return (
              <group key={`rel-${rel}-${i}`}>
                <Line
                  points={[new THREE.Vector3(0, 0, 0), p]}
                  color={centerColor}
                  opacity={0.6}
                  transparent
                  lineWidth={1.5}
                />
                <group position={p.toArray()}>
                  <Text
                    fontSize={0.26}
                    color={col}
                    anchorX='center'
                    anchorY='middle'
                    outlineWidth={0.002}
                    outlineColor='#000'
                    fillOpacity={0.9}
                  >
                    {rel}
                  </Text>
                </group>
              </group>
            );
          })}
      </group>
    );
  }

  // Fallback: original structural ring (useful if no active emotion yet)
  return (
    <group>
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
      {nodes.map((n) => (
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
      ))}
    </group>
  );
}
