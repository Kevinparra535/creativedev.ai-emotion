import * as THREE from 'three';
import { useMemo, useRef, useState } from 'react';
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
  targetColorHex?: string; // target color from universe (lerp towards it)
  pulseIntensity?: number; // [0..1] scale pulse driver
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
  thinkingBlink = 0,
  targetColorHex,
  pulseIntensity = 0
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
  const sphereRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);
  const tRef = useRef(0);
  const currentColor = useRef(new THREE.Color(colorB ?? colorA));

  // Hover pulse animation to add a subtle bloom pop when sound plays
  useFrame((_, delta) => {
    // Exponential decay of pulse
    pulseRef.current += (0 - pulseRef.current) * Math.min(1, delta * 4);
    tRef.current += delta;
    // Base intensity considers global thinking dim (very low when thinking)
    const dimBase = 0.008;
    const baseThinking = thinking ? dimBase : emissiveIntensity;
    // Apply hover boost over the chosen base
    const hoverBase =
      hovered && interactive ? (hoverEmissive ?? baseThinking * 1.6) : baseThinking;
    // Add a small blink boost during thinking
    const blinkBoost = thinking ? (thinkingBlink ?? 0) * 0.08 : 0;
    const boosted = (hoverBase + blinkBoost) * (1 + 0.6 * pulseRef.current);
    if (matRef.current) matRef.current.emissiveIntensity = boosted;
    const haloBase = thinking ? 0.02 : 0.12;
    if (haloMatRef.current) haloMatRef.current.opacity = haloBase * (1 + 1.5 * pulseRef.current);
    if (haloMeshRef.current) haloMeshRef.current.scale.setScalar(1 + 0.08 * pulseRef.current);

    // Lerp material color/emissive towards target
    if (targetColorHex && matRef.current) {
      const target = new THREE.Color(targetColorHex);
      currentColor.current.lerp(target, Math.min(1, delta * 2));
      (matRef.current as any).color?.copy(currentColor.current);
      (matRef.current as any).emissive?.copy(currentColor.current);
    }

    // Scale pulse based on pulseIntensity (intensity-driven frequency and base amplitude)
    if (sphereRef.current) {
      const freq = 4 * Math.max(0, pulseIntensity);
      const amp = 0.1; // base amplitude
      const s = 1 + Math.sin(tRef.current * freq) * amp;
      sphereRef.current.scale.set(radius * s, radius * s, radius * s);
    }
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
      <mesh ref={sphereRef} castShadow receiveShadow scale={[radius, radius, radius]}>
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

export function EnergyPulse({
  a,
  b,
  ctrl,
  colorA,
  colorB,
  speed = 0.35,
  size = 0.08,
  phase = 0
}: Readonly<{
  a: THREE.Vector3;
  b: THREE.Vector3;
  ctrl: THREE.Vector3;
  colorA: string;
  colorB: string;
  speed?: number;
  size?: number;
  phase?: number;
}>) {
  const ref = useRef<THREE.Mesh>(null);
  const tRef = useRef(phase % 1);
  const cA = useMemo(() => new THREE.Color(colorA), [colorA]);
  const cB = useMemo(() => new THREE.Color(colorB), [colorB]);

  useFrame((_, delta) => {
    tRef.current += speed * delta;
    if (tRef.current > 1) tRef.current -= 1;
    const t = tRef.current;
    const one = 1 - t;
    const p = new THREE.Vector3()
      .copy(a)
      .multiplyScalar(one * one)
      .add(new THREE.Vector3().copy(ctrl).multiplyScalar(2 * one * t))
      .add(new THREE.Vector3().copy(b).multiplyScalar(t * t));
    if (ref.current) {
      ref.current.position.copy(p);
      // Lerp color along the path for cohesive gradient pulse
      const cc = cA.clone().lerp(cB, t);
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.color.copy(cc);
      mat.emissive.copy(cc);
      // Soft breathing within the pulse
      const s = size * (0.9 + 0.2 * Math.sin(t * Math.PI * 2));
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial emissiveIntensity={1} roughness={0.2} metalness={0.05} />
    </mesh>
  );
}
