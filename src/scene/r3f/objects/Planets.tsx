import * as THREE from 'three';
import { useRef, useState } from 'react';
import { Text, useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import config from '@/config/config';
import { usePlanetTexturePack } from '../utils/planetTextures';
import AudioManager from '@/audio/AudioManager';

export type PlanetProps = {
  position: THREE.Vector3 | [number, number, number];
  colorA: string;
  colorB?: string;
  label: string;
  radius?: number;
  emissiveIntensity?: number;
  interactive?: boolean;
  hoverEmissive?: number; // optional emissive intensity when hovered
  texturePack?: string; // optional PBR texture pack name
  thinking?: boolean; // global thinking/loading dim state
  thinkingBlink?: number; // [0..1] extra boost when blinking during thinking
};

export function Planet({
  position,
  colorA,
  colorB,
  label,
  radius = 1,
  emissiveIntensity = 0.75,
  interactive = true,
  hoverEmissive,
  texturePack,
  thinking = false,
  thinkingBlink = 0
}: Readonly<PlanetProps>) {
  const packName =
    texturePack ??
    (config.TEXTURES.ENABLED && config.TEXTURES.PLANET_KEY === label.toLowerCase()
      ? config.TEXTURES.PACK
      : undefined);
  const segments = packName ? 128 : 48;
  const pos = Array.isArray(position) ? position : position.toArray();
  const emissive = new THREE.Color(colorB ?? colorA);
  const [hovered, setHovered] = useState<boolean>(false);
  useCursor(interactive && hovered);
  const matRef = useRef<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | null>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  // Hover pulse animation to add a subtle bloom pop when sound plays
  useFrame((_, delta) => {
    // Exponential decay of pulse
    pulseRef.current += (0 - pulseRef.current) * Math.min(1, delta * 4);
    // Base intensity considers global thinking dim
    const dimBase = Math.max(0.04, Math.min(0.1, emissiveIntensity * 0.12));
    const baseThinking = thinking ? dimBase : emissiveIntensity;
    // Apply hover boost over the chosen base
    const hoverBase =
      hovered && interactive ? (hoverEmissive ?? baseThinking * 1.6) : baseThinking;
    // Add a small blink boost during thinking
    const blinkBoost = thinking ? (thinkingBlink ?? 0) * 0.22 : 0;
    const boosted = (hoverBase + blinkBoost) * (1 + 0.6 * pulseRef.current);
    if (matRef.current) matRef.current.emissiveIntensity = boosted;
    if (haloMatRef.current) haloMatRef.current.opacity = 0.12 * (1 + 1.5 * pulseRef.current);
    if (haloMeshRef.current) haloMeshRef.current.scale.setScalar(1 + 0.08 * pulseRef.current);
  });

  // Initial emissive intensity (will be overridden each frame above)
  const effEmissive = emissiveIntensity;

  return (
    <group
      position={pos}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(true);
              // play hover sfx for this planet's label
              AudioManager.playHoverForEmotion(label).catch(() => {});
              // trigger visual pulse
              pulseRef.current = 1;
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
        <sphereGeometry
          args={[1, segments, segments]}
          onUpdate={(g) => {
            // Ensure uv2 exists so aoMap/displacement sample correctly
            // Some texture packs rely on aoMap which requires uv2
            const geo = g as THREE.BufferGeometry;
            const uv2 = (geo.attributes as any).uv2;
            if (!uv2 && (geo.attributes as any).uv) {
              geo.setAttribute('uv2', (geo.attributes as any).uv);
            }
          }}
        />
        {packName ? (
          <PlanetPBRMaterial
            onMat={(m) => {
              // assign to common ref for hover emissive control
              (matRef as any).current = m;
            }}
            packName={packName}
            colorA={colorA}
            emissive={emissive}
            emissiveIntensity={effEmissive}
          />
        ) : (
          <>
            <meshStandardMaterial
              color={colorA}
              emissive={emissive}
              emissiveIntensity={effEmissive}
              roughness={0.45}
              metalness={0.06}
              ref={matRef}
            />
            <meshPhysicalMaterial
              roughness={0}
              color={colorA}
              emissive={emissive || colorA}
              envMapIntensity={0.2}
            />
          </>
        )}
      </mesh>
      {/* halo */}
      <mesh ref={haloMeshRef}>
        <sphereGeometry args={[radius * 1.25, 32, 32]} />
        <meshBasicMaterial color={colorA} transparent opacity={0.12} ref={haloMatRef} />
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

export function jitterZ(seed: number) {
  const r = Math.sin(seed * 12.9898) * 43758.5453;
  return ((r % 1) - 0.5) * 0; // widen depth jitter [-0.6..0.6]
}

// Separate component to mount a PBR material with the provided texture pack
export function PlanetPBRMaterial({
  packName,
  colorA,
  emissive,
  emissiveIntensity,
  onMat
}: Readonly<{
  packName: string;
  colorA: string;
  emissive: THREE.Color;
  emissiveIntensity: number;
  onMat?: (m: THREE.MeshPhysicalMaterial | null) => void;
}>) {
  const tex = usePlanetTexturePack(packName);
  const useDisp = Boolean(tex.displacementMap && config.TEXTURES.ENABLE_DISPLACEMENT);
  return (
    <meshPhysicalMaterial
      ref={onMat as any}
      color={colorA}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      map={tex.map}
      normalMap={tex.normalMap}
      roughnessMap={tex.roughnessMap}
      aoMap={tex.aoMap}
      aoMapIntensity={1}
      displacementMap={useDisp ? tex.displacementMap : undefined}
      displacementScale={useDisp ? config.TEXTURES.DISPLACEMENT_SCALE : 0}
      metalnessMap={tex.metalnessMap}
      roughness={0.8}
      metalness={0.1}
      normalScale={new THREE.Vector2(1, 1)}
      envMapIntensity={0.35}
      clearcoat={0.4}
      clearcoatRoughness={0.25}
    />
  );
}
