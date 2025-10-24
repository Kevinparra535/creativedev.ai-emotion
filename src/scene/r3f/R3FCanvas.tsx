import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type ReactElement } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import { CameraControls, PerspectiveCamera, Stars, Stats } from '@react-three/drei';
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
  ChromaticAberration
} from '@react-three/postprocessing';
import { Vector2 } from 'three';

import ClustersScene from './ClustersScene';

import { useUIStore } from '@/stores/uiStore';
import { useUniverse } from '@/state/universe.store';
import { useVisualLeva } from '@/hooks/useVisualLeva';

extend({ UnrealBloomPass });

const R3FCanvas = () => {
  // device-adaptive DPR for perf
  const dpr = useMemo(() => {
    const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const mem = (navigator as any).deviceMemory ?? 8;
    const lowEnd = reduce || mem <= 4;
    const max = lowEnd ? 1.25 : 2;
    return Math.min(globalThis.devicePixelRatio || 1, max);
  }, []);

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
      dpr={dpr}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 100] }}
      frameloop='always'
      onCreated={(state) => {
        state.gl.setClearColor(new THREE.Color(0x000000), 0);
      }}
    >
      <Suspense fallback={null}>
        <Stats />
        {/* Dim global lights when thinking */}
        <SceneLights />
        <BackgroundTone />

        <ClustersScene layout='arrow' />
        {/* <UniverseScene /> */}

        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <CameraControls />

        {/* <PostFX /> */}

        <Stars radius={200} depth={1} count={5000} factor={2} saturation={0} fade speed={2} />
      </Suspense>
    </Canvas>
  );
};

export default R3FCanvas;

function SceneLights() {
  const thinking = useUIStore((s) => s.thinking);
  const emotions = useUniverse((s) => s.emotions);
  // Base intensities with thinking dim
  const ambBase = thinking ? 0.08 : 0.35;
  const dirBase = thinking ? 0.15 : 0.8;
  // Compute global arousal (0..1) to slightly boost light intensity when emotions exist
  let arousal = 0;
  if (emotions.length > 0) {
    let wSum = 0;
    for (const e of emotions) {
      const w = e.intensity ?? 0.6;
      wSum += w;
      arousal += w * (e.arousal ?? 0.5);
    }
    arousal = wSum > 0 ? arousal / wSum : 0;
  }
  const boost = emotions.length > 0 ? 1 + arousal * 0.35 : 1;
  const ambI = ambBase * boost;
  const dirI = dirBase * boost;

  // Tint lights towards warm/cold based on valence (subtle)
  let tint = new THREE.Color(0xffffff);
  if (emotions.length > 0) {
    let v = 0;
    let wSum = 0;
    for (const e of emotions) {
      const w = e.intensity ?? 0.6;
      wSum += w;
      v += w * e.valence;
    }
    v = wSum > 0 ? v / wSum : 0;
    const warm = new THREE.Color('#ffd166');
    const cold = new THREE.Color('#7e57c2');
    tint = v >= 0 ? cold.lerp(warm, v) : warm.lerp(cold, -v);
    // reduce saturation for light tint
    const hsl = { h: 0, s: 0, l: 0 } as any;
    tint.getHSL(hsl);
    tint.setHSL(hsl.h, Math.min(0.3, hsl.s * 0.3), Math.min(0.7, hsl.l));
  }
  return (
    <>
      <ambientLight intensity={ambI} color={tint} />
      <directionalLight position={[2, 3, 5]} intensity={dirI} color={tint} castShadow />
      <directionalLight position={[-2, -3, -5]} intensity={dirI} color={tint} castShadow />
    </>
  );
}

function BackgroundTone() {
  const { gl } = useThree();
  const emotions = useUniverse((s) => s.emotions);
  const current = useRef(new THREE.Color(0x000000));

  useFrame((_, delta) => {
    // No emotions: drift back to black
    let target = new THREE.Color(0x000000);
    if (emotions.length > 0) {
      // Weighted global valence/arousal
      let v = 0;
      let a = 0;
      let wSum = 0;
      for (const e of emotions) {
        const w = e.intensity ?? 0.6;
        wSum += w;
        v += w * e.valence; // [-1..1]
        a += w * (e.arousal ?? 0.5); // [0..1]
      }
      v = wSum > 0 ? v / wSum : 0;
      a = wSum > 0 ? a / wSum : 0.5;

      // Map valence to warm/cold base, arousal to saturation/intensity
      const warmLow = new THREE.Color('#ff8fa3');
      const warmHigh = new THREE.Color('#ffd166');
      const coldLow = new THREE.Color('#64b5f6');
      const coldHigh = new THREE.Color('#7e57c2');

      if (v >= 0) {
        // Interpolate within warm palette by v [0..1]
        target = warmLow.clone().lerp(warmHigh, Math.min(1, v));
      } else {
        // Interpolate within cold palette by -v [0..1]
        target = coldLow.clone().lerp(coldHigh, Math.min(1, -v));
      }
      // Much more subtle saturation/brightness
      const hsl = { h: 0, s: 0, l: 0 } as any;
      target.getHSL(hsl);
      const sTarget = Math.min(0.35, hsl.s * (0.25 + a * 0.25));
      const lTarget = Math.min(0.22, 0.1 + a * 0.12);
      target.setHSL(hsl.h, sTarget, lTarget);
      // Blend heavily towards black to keep it subtle
      target = target.lerp(new THREE.Color(0x000000), 0.7);
    }

    // Smooth transition
    current.current.lerp(target, Math.min(1, delta * 0.8));
    gl.setClearColor(current.current, 1);
  });

  return null;
}

function PostFX() {
  const { post } = useVisualLeva();
  const children: ReactElement[] = [];
  if (post.bloomEnabled) {
    children.push(
      <Bloom
        key='bloom'
        luminanceThreshold={post.bloomThreshold}
        luminanceSmoothing={post.bloomSmoothing}
        intensity={post.bloomIntensity}
        height={300}
      />
    );
  }
  if (post.noiseEnabled) {
    children.push(<Noise key='noise' opacity={post.noiseOpacity} />);
  }
  if (post.vignetteEnabled) {
    children.push(
      <Vignette
        key='vignette'
        eskil={false}
        offset={post.vignetteOffset}
        darkness={post.vignetteDarkness}
      />
    );
  }
  if (post.chromaEnabled) {
    children.push(
      <ChromaticAberration
        key='chroma'
        offset={new Vector2(post.chromaOffset, -post.chromaOffset)}
      />
    );
  }
  return <EffectComposer>{children}</EffectComposer>;
}
