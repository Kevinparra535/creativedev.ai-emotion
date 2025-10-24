import { Canvas, extend } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import { CameraControls, PerspectiveCamera, Stars, Stats } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';

import ClustersScene from './ClustersScene';

import { useUIStore } from '@/stores/uiStore';
import UniverseScene from './UniverseScene';

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

        <ClustersScene layout='arrow' />
        {/* <UniverseScene /> */}

        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <CameraControls />

        <EffectComposer>
          {/* <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} /> */}
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        <Stars radius={200} depth={1} count={6000} factor={2.5} saturation={0} fade speed={2} />
      </Suspense>
    </Canvas>
  );
};

export default R3FCanvas;

function SceneLights() {
  const thinking = useUIStore((s) => s.thinking);
  const ambI = thinking ? 0.08 : 0.35;
  const dirI = thinking ? 0.15 : 0.8;
  return (
    <>
      <ambientLight intensity={ambI} />
      <directionalLight position={[2, 3, 5]} intensity={dirI} castShadow />
      <directionalLight position={[-2, -3, -5]} intensity={dirI} castShadow />
    </>
  );
}
