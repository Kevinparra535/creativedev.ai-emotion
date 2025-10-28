import { useMemo, useRef, useState } from 'react';
import { Text, useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import config from '@/config/config';

import { usePlanetTexturePack } from '../../../utils/planetTextures';
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

// Watercolor-like blended planet built from multiple emotion colors
export function PrimaryBlendPlanet({
  position,
  colors,
  label = 'blend',
  radius = 1.4,
  intensity = 0.6,
  speed = 0.6,
  // Effects parity with Planet (without halo)
  emissiveIntensity = 0.75,
  interactive = true,
  hoverEmissive,
  thinking = false,
  thinkingBlink = 0,
  pulseIntensity = 0,
  targetColorHex,
  segments = 128,
  sharpness = 2.2,
  spinSpeed = 1,
  effect = 'Watercolor',
  targetMix = 0.25,
  wcWash = 0.06,
  wcScale = 1,
  wcFlow = 1,
  wcSharpness = 2.2,
  oilSwirl = 0.9,
  oilScale = 1.4,
  oilFlow = 0.9,
  oilShine = 0.35,
  oilContrast = 2.2,
  // Link effect params
  linkDensity = 1.2,
  linkThickness = 0.5,
  linkNoise = 0.5,
  linkFlow = 1.0,
  linkContrast = 2.0,
  // Holographic effect params
  holoIntensity = 0.75,
  holoFresnel = 3,
  holoDensity = 10,
  holoThickness = 0.45,
  holoSpeed = 1.1,
  // Voronoi params
  voroScale = 1.6,
  voroSoft = 0.2,
  voroFlow = 0.9,
  voroJitter = 0.75,
  voroEdge = 0.8,
  voroContrast = 2
}: Readonly<{
  position: THREE.Vector3 | [number, number, number];
  colors: string[]; // hex colors to blend
  label?: string;
  radius?: number;
  intensity?: number; // drives breathing
  speed?: number; // flow speed
  emissiveIntensity?: number;
  interactive?: boolean;
  hoverEmissive?: number;
  thinking?: boolean;
  thinkingBlink?: number;
  pulseIntensity?: number;
  targetColorHex?: string;
  segments?: number;
  sharpness?: number;
  spinSpeed?: number;
  effect?: 'Watercolor' | 'Oil' | 'Link' | 'Holographic' | 'Voronoi';
  targetMix?: number;
  wcWash?: number;
  wcScale?: number;
  wcFlow?: number;
  wcSharpness?: number;
  oilSwirl?: number;
  oilScale?: number;
  oilFlow?: number;
  oilShine?: number;
  oilContrast?: number;
  // Link effect params
  linkDensity?: number;
  linkThickness?: number;
  linkNoise?: number;
  linkFlow?: number;
  linkContrast?: number;
  // Holographic effect params
  holoIntensity?: number;
  holoFresnel?: number;
  holoDensity?: number;
  holoThickness?: number;
  holoSpeed?: number;
  // Voronoi params
  voroScale?: number;
  voroSoft?: number;
  voroFlow?: number;
  voroJitter?: number;
  voroEdge?: number;
  voroContrast?: number;
}>) {
  const [hovered, setHovered] = useState<boolean>(false);

  const palette = useMemo(() => colors.slice(0, 12).map((h) => new THREE.Color(h)), [colors]);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const pulseRef = useRef(0);

  useCursor(interactive && hovered);

  const pos = Array.isArray(position) ? position : position.toArray();
  const n = Math.max(0, Math.min(12, colors.length));

  // Keep a smooth target color for subtle bias
  const targetColorRef = useRef(new THREE.Color('#ffffff'));
  const uniforms = useMemo(() => {
    const cols = new Float32Array(12 * 3);
    for (let i = 0; i < 12; i++) {
      const c = palette[i] ?? new THREE.Color('#444');
      cols[i * 3 + 0] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return {
      uTime: { value: 0 },
      uScale: { value: wcScale },
      uSeed: { value: Math.random() * 1000 },
      uCount: { value: n },
      uColors: { value: cols },
      uLightDir: { value: new THREE.Vector3(0.4, 0.7, 0.5).normalize() },
      uAlpha: { value: 1 },
      // extra effects
      uEffect: {
        value:
          effect === 'Oil'
            ? 1
            : effect === 'Link'
              ? 2
              : effect === 'Holographic'
                ? 3
                : effect === 'Voronoi'
                  ? 4
                  : 0
      },
      uBrightness: { value: emissiveIntensity },
      uTargetColor: { value: new THREE.Vector3(1, 1, 1) },
      uTargetMix: { value: 0 },
      uSharpness: { value: sharpness },
      uWash: { value: wcWash },
      uFlow: { value: wcFlow },
      // Oil uniforms
      uOilSwirl: { value: oilSwirl },
      uOilScale: { value: oilScale },
      uOilFlow: { value: oilFlow },
      uOilShine: { value: oilShine },
      uOilContrast: { value: oilContrast },
      // Link uniforms
      uLinkDensity: { value: linkDensity },
      uLinkThickness: { value: linkThickness },
      uLinkNoise: { value: linkNoise },
      uLinkFlow: { value: linkFlow },
      uLinkContrast: { value: linkContrast },
      // Holographic uniforms
      uHoloIntensity: { value: holoIntensity },
      uHoloFresnel: { value: holoFresnel },
      uHoloDensity: { value: holoDensity },
      uHoloThickness: { value: holoThickness },
      uHoloSpeed: { value: holoSpeed },
      // Voronoi uniforms
      uVoroScale: { value: voroScale },
      uVoroSoft: { value: voroSoft },
      uVoroFlow: { value: voroFlow },
      uVoroJitter: { value: voroJitter },
      uVoroEdge: { value: voroEdge },
      uVoroContrast: { value: voroContrast }
    } as Record<string, any>;
  }, [
    palette,
    n,
    emissiveIntensity,
    sharpness,
    wcWash,
    wcScale,
    wcFlow,
    effect,
    oilSwirl,
    oilScale,
    oilFlow,
    oilShine,
    oilContrast,
    linkDensity,
    linkThickness,
    linkNoise,
    linkFlow,
    linkContrast,
    holoIntensity,
    holoFresnel,
    holoDensity,
    holoThickness,
    holoSpeed,
    voroScale,
    voroSoft,
    voroFlow,
    voroJitter,
    voroEdge,
    voroContrast
  ]);

  // Update colors if palette changes
  useMemo(() => {
    if (!matRef.current) return;
    const cols = matRef.current.uniforms.uColors.value as Float32Array;
    for (let i = 0; i < 12; i++) {
      const c = palette[i] ?? new THREE.Color('#444');
      cols[i * 3 + 0] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    matRef.current.uniforms.uCount.value = n;
  }, [palette, n]);

  useFrame((_, delta) => {
    tRef.current += delta * (0.5 + speed);
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = tRef.current;
      matRef.current.uniforms.uScale.value = wcScale;
      matRef.current.uniforms.uWash.value = wcWash;
      matRef.current.uniforms.uFlow.value = wcFlow;
      matRef.current.uniforms.uEffect.value =
        effect === 'Oil'
          ? 1
          : effect === 'Link'
            ? 2
            : effect === 'Holographic'
              ? 3
              : effect === 'Voronoi'
                ? 4
                : 0;
      // Allow EV2 to override watercolor sharpness in real-time
      matRef.current.uniforms.uSharpness.value =
        wcSharpness ?? matRef.current.uniforms.uSharpness.value;
      // Update Oil uniforms
      matRef.current.uniforms.uOilSwirl.value = oilSwirl;
      matRef.current.uniforms.uOilScale.value = oilScale;
      matRef.current.uniforms.uOilFlow.value = oilFlow;
      matRef.current.uniforms.uOilShine.value = oilShine;
      matRef.current.uniforms.uOilContrast.value = oilContrast;
      // Update Link uniforms
      matRef.current.uniforms.uLinkDensity.value = linkDensity;
      matRef.current.uniforms.uLinkThickness.value = linkThickness;
      matRef.current.uniforms.uLinkNoise.value = linkNoise;
      matRef.current.uniforms.uLinkFlow.value = linkFlow;
      matRef.current.uniforms.uLinkContrast.value = linkContrast;
      // Update Holographic uniforms
      matRef.current.uniforms.uHoloIntensity.value = holoIntensity;
      matRef.current.uniforms.uHoloFresnel.value = holoFresnel;
      matRef.current.uniforms.uHoloDensity.value = holoDensity;
      matRef.current.uniforms.uHoloThickness.value = holoThickness;
      matRef.current.uniforms.uHoloSpeed.value = holoSpeed;
      // Update Voronoi uniforms
      matRef.current.uniforms.uVoroScale.value = voroScale;
      matRef.current.uniforms.uVoroSoft.value = voroSoft;
      matRef.current.uniforms.uVoroFlow.value = voroFlow;
      matRef.current.uniforms.uVoroJitter.value = voroJitter;
      matRef.current.uniforms.uVoroEdge.value = voroEdge;
      matRef.current.uniforms.uVoroContrast.value = voroContrast;
    }
    // Scale breathing + hover pulse
    if (meshRef.current) {
      // exponential decay of pulse
      pulseRef.current += (0 - pulseRef.current) * Math.min(1, delta * 4);
      // Bounce fix: when intensity==0, no oscillation (except transient hover pulse)
      const baseAmp = 0.12 * Math.max(0, Math.min(1, intensity));
      // include intensity-driven micro-pulse similar to Planet
      const freq = 4 * Math.max(0, pulseIntensity);
      const micro =
        Math.sin(tRef.current * Math.max(0.001, freq)) *
        0.06 *
        Math.max(0, pulseIntensity) *
        Math.max(0, Math.min(1, intensity));
      const breath = Math.sin(tRef.current * 2.2) * baseAmp;
      const s = radius * (1 + breath + micro + 0.06 * pulseRef.current);
      meshRef.current.scale.set(s, s, s);
      // constant spin: full 360° every ~24s
      const spinPeriodSec = 24 / Math.max(0.001, spinSpeed);
      meshRef.current.rotation.y += ((Math.PI * 2) / spinPeriodSec) * delta;
    }
    // Compute brightness like Planet's emissive flow (without halo)
    const dimBase = 0.008;
    const baseThinking = thinking ? dimBase : emissiveIntensity;
    const hoverBase =
      hovered && interactive ? (hoverEmissive ?? baseThinking * 1.6) : baseThinking;
    const blinkBoost = thinking ? (thinkingBlink ?? 0) * 0.08 : 0;
    const boosted = (hoverBase + blinkBoost) * (1 + 0.6 * pulseRef.current);
    if (matRef.current) {
      matRef.current.uniforms.uBrightness.value = boosted;
    }

    // Target color bias
    if (targetColorHex && matRef.current) {
      const target = new THREE.Color(targetColorHex);
      targetColorRef.current.lerp(target, Math.min(1, delta * 2));
      const v = targetColorRef.current;
      matRef.current.uniforms.uTargetColor.value.set(v.r, v.g, v.b);
      matRef.current.uniforms.uTargetMix.value = Math.max(0, Math.min(1, targetMix));
    } else if (matRef.current) {
      matRef.current.uniforms.uTargetMix.value = 0.0;
    }
  });

  const vert = /* glsl */ `
    varying vec3 vNormalW;
    varying vec3 vWorldPos;
    varying vec2 vUv; // retained for compatibility, not used in shader to avoid seams
    void main(){
      vUv = uv;
      vec4 wPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = wPos.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * wPos;
    }
  `;

  const frag = /* glsl */ `
    precision highp float;
    varying vec3 vNormalW;
    varying vec3 vWorldPos;
    varying vec2 vUv;
    uniform vec3 cameraPosition;
    uniform float uTime;
    uniform float uScale;
    uniform float uSeed;
    uniform int uCount;
    uniform vec3 uLightDir;
    uniform float uAlpha;
    uniform float uColors[36]; // 12 * 3 rgb
  uniform int uEffect; // 0 watercolor, 1 oil, 2 link, 3 holographic, 4 voronoi
    uniform float uBrightness;
    uniform vec3 uTargetColor;
    uniform float uTargetMix;
    uniform float uSharpness;
    uniform float uWash;
    uniform float uFlow;
    // Oil
    uniform float uOilSwirl;
    uniform float uOilScale;
    uniform float uOilFlow;
    uniform float uOilShine;
    uniform float uOilContrast;
    // Link
    uniform float uLinkDensity;
    uniform float uLinkThickness;
    uniform float uLinkNoise;
    uniform float uLinkFlow;
    uniform float uLinkContrast;
  // Holographic
  uniform float uHoloIntensity;
  uniform float uHoloFresnel;
  uniform float uHoloDensity;
  uniform float uHoloThickness;
  uniform float uHoloSpeed;
  // Voronoi
  uniform float uVoroScale;
  uniform float uVoroSoft;
  uniform float uVoroFlow;
  uniform float uVoroJitter;
  uniform float uVoroEdge;
  uniform float uVoroContrast;

    // Hash/Noise helpers
    float hash(vec2 p){
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0));
      float d = hash(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      for(int i=0;i<5;i++){
        v += a*noise(p); p *= 2.02; a *= 0.5;
      }
      return v;
    }
    vec2 random2(vec2 p){
      return vec2(
        fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123),
        fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123)
      );
    }
    vec3 getColor(int i){
      int idx = i*3;
      return vec3(uColors[idx], uColors[idx+1], uColors[idx+2]);
    }
    vec2 swirl(vec2 uv, float amount, float t){
      vec2 c = uv - 0.5;
      float r = length(c);
      float a = atan(c.y, c.x);
      float ang = amount * (0.6 + 0.4*sin(6.2831*(r*1.2 + t)));
      a += ang;
      vec2 s = vec2(cos(a), sin(a)) * r;
      return s + 0.5;
    }
    void main(){
      // Seamless base UV from geometry normal: continuous on sphere
      vec3 Nw = normalize(vNormalW);
      vec2 baseUV = Nw.xz * 0.5 + 0.5;
      vec3 col;
      if(uEffect == 0){
        // Watercolor
        vec2 p = baseUV * uScale;
        float t = uTime * 0.15 * max(0.001, uFlow) + uSeed;
        float f = fbm(p + vec2(t, -t));
        vec3 acc = vec3(0.0);
        float wsum = 0.0;
        for(int i=0;i<12;i++){
          if(i>=uCount) break;
          float phase = float(i)*1.618 + t*0.9;
          float n = fbm(p*1.3 + vec2(cos(phase), sin(phase))*0.6);
          float w = smoothstep(0.35, 0.95, 0.5 + 0.5*sin(6.2831*n + phase));
          w = pow(w, max(1.0, uSharpness));
          acc += getColor(i) * w;
          wsum += w;
        }
        col = wsum > 0.0001 ? acc / wsum : vec3(0.5);
        col = mix(col, vec3(dot(col, vec3(0.333))), clamp(uWash, 0.0, 0.5));
      } else if(uEffect == 1) {
        // Oil marbling
        float t = uTime * 0.18 * max(0.001, uOilFlow) + uSeed;
        vec2 p0 = swirl(baseUV, uOilSwirl, t);
        vec2 p = (p0 - 0.5) * uOilScale + 0.5;
        vec3 acc = vec3(0.0);
        float wsum = 0.0;
        for(int i=0;i<12;i++){
          if(i>=uCount) break;
          float k = float(i) * 0.73 + t*0.6;
          float band = 0.5 + 0.5*sin(6.2831*(p.x*1.2 + fbm(p*2.0 + vec2(k, -k))*0.6 + k));
          band = pow(band, max(1.0, uOilContrast));
          vec3 c = getColor(i);
          acc += c * band;
          wsum += band;
        }
        col = wsum > 0.0001 ? acc / wsum : vec3(0.5);
        // simple specular highlight
        vec3 N = normalize(vNormalW);
        vec3 L = normalize(uLightDir);
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 16.0 + 64.0*uOilShine);
        col += spec * 0.25;
      } else if(uEffect == 2) {
        // Link effect: flowing line bands that highlight connections
        float t = uTime * 0.2 * max(0.001, uLinkFlow) + uSeed;
        vec2 p = baseUV + vec2(fbm(baseUV*3.1 + t)*0.05*uLinkNoise);
        vec3 acc = vec3(0.0);
        float wsum = 0.0;
        for(int i=0;i<12;i++){
          if(i>=uCount) break;
          float angle = float(i) * 0.47;
          vec2 dir = vec2(cos(angle), sin(angle));
          float proj = dot(p + vec2(0.11*t, -0.09*t), dir) * uLinkDensity;
          float wave = 0.5 + 0.5*cos(6.2831*proj);
          float edgeA = 0.5 - 0.12*uLinkThickness;
          float edgeB = 0.5 + 0.12*uLinkThickness;
          float line = smoothstep(edgeB, edgeA, abs(wave-0.5));
          line = pow(line, max(1.0, uLinkContrast));
          acc += getColor(i) * line;
          wsum += line;
        }
        col = wsum > 0.0001 ? acc / wsum : vec3(0.5);
        // subtle extra glow on lines to distinguish from oil bands
        float glow = clamp(wsum / max(1.0, float(uCount)), 0.0, 1.0);
        col = clamp(col + vec3(glow * 0.2), 0.0, 1.0);
      } else if(uEffect == 3) {
        // Holographic effect: iridescent fresnel with scanning lines
        // Base color: average of input palette
        vec3 base = vec3(0.0);
        for(int i=0;i<12;i++){
          if(i>=uCount) break;
          base += getColor(i);
        }
        base /= max(1.0, float(uCount));
        // Fresnel term approximating view-dependent glow
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fres = pow(1.0 - max(dot(N, V), 0.0), max(1.0, uHoloFresnel));
        // Iridescent rainbow
        float h = fract(uTime * 0.05 * uHoloSpeed + baseUV.x * 0.45 + baseUV.y * 0.35);
        vec3 iri = clamp(0.5 + 0.5 * sin(6.2831 * (h + vec3(0.0, 1.0/3.0, 2.0/3.0))), 0.0, 1.0);
        // Scanning lines along v axis
        float bands = 0.5 + 0.5 * sin(6.2831 * (baseUV.y * uHoloDensity + uTime * 0.2 * uHoloSpeed));
        float edgeA = 0.5 - 0.25 * uHoloThickness;
        float edgeB = 0.5 + 0.25 * uHoloThickness;
        float line = smoothstep(edgeB, edgeA, abs(bands - 0.5));
        // Combine
        vec3 holo = mix(base, iri, 0.6) * (0.4 + 0.6 * fres) + iri * (line * 0.8);
        col = mix(base, holo, clamp(uHoloIntensity, 0.0, 1.0));
      } else {
        // Voronoi effect: cellular pattern with emissive edges
        float t = uTime * 0.15 * max(0.001, uVoroFlow) + uSeed;
        // Warp baseUV slightly for organic motion
        vec2 uv = baseUV * uVoroScale;
        uv += vec2(fbm(baseUV*2.3 + t) - 0.5, fbm(baseUV*2.1 - t) - 0.5) * 0.4 * uVoroFlow;

        vec2 i = floor(uv);
        vec2 f = fract(uv);
        float minD = 1e9;
        float secondD = 1e9;
        vec2 minCell = vec2(0.0);
        for(int y=-1; y<=1; y++){
          for(int x=-1; x<=1; x++){
            vec2 g = vec2(float(x), float(y));
            vec2 o = random2(i + g) - 0.5;
            o *= uVoroJitter;
            vec2 r = g + o - f;
            float d = dot(r, r);
            if(d < minD){
              secondD = minD;
              minD = d;
              minCell = g + o;
            } else if(d < secondD){
              secondD = d;
            }
          }
        }
        float dist = sqrt(minD);
        float edge = sqrt(secondD) - dist;
        // Edge highlight
        float e = 1.0 - smoothstep(0.0, max(0.0001, uVoroSoft), edge);
        e = pow(e, 1.2);
        // Compute a color per-cell based on hashed cell id
        float cellId = hash(i + minCell);
        int idx = int(floor(cellId * 12.0));
        idx = clamp(idx, 0, 11);
        vec3 cellCol = getColor(idx);
        // Optional contrast for cell fill
        float fill = pow(1.0 - smoothstep(0.0, 0.9, dist), max(1.0, uVoroContrast));
        vec3 base = cellCol * fill;
        // add emissive-like edges colored by average palette
        vec3 avg = vec3(0.0);
        for(int i2=0;i2<12;i2++){
          if(i2>=uCount) break;
          avg += getColor(i2);
        }
        avg /= max(1.0, float(uCount));
        vec3 edgeCol = mix(cellCol, avg, 0.5);
        col = clamp(base + edgeCol * e * uVoroEdge, 0.0, 1.0);
      }
      // subtle target bias (like lerp towards targetColorHex)
      col = mix(col, uTargetColor, clamp(uTargetMix, 0.0, 1.0));
      // simple lambert + emissive add (more vivid, like other planets)
      float diff = clamp(dot(normalize(vNormalW), normalize(uLightDir)), 0.12, 1.0);
      vec3 lit = col * diff;
      vec3 emis = col * uBrightness;
      col = clamp(lit + emis, 0.0, 1.0);
      gl_FragColor = vec4(col, uAlpha);
    }
  `;

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
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry
          key={`blend-${segments}`}
          args={[1, Math.max(16, segments), Math.max(12, Math.round(segments * 0.75))]}
        />
        <shaderMaterial
          ref={matRef as any}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
          transparent
        />
      </mesh>
      <group position={[0, radius + 0.28, 0]}>
        <Text
          fontSize={Math.max(0.18, radius * 0.28)}
          color={'#ffffff'}
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
