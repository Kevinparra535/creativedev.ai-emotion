import { Suspense, useMemo } from 'react';
import { CameraShake, PerspectiveCamera, Stars, Stats } from '@react-three/drei';
import { Canvas, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three-stdlib';

import ClustersScene from './ClustersScene';
import PostFX from './components/PostFX';
import BackgroundTone from './objects/BackgroundTone';
import CameraRig from './objects/CameraRig';
import SceneLights from './objects/SceneLights';

extend({ UnrealBloomPass });

const R3FCanvas = () => {
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
        powerPreference: 'high-performance',
        // Enable stable screenshots via toDataURL()
        preserveDrawingBuffer: true
      }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 100] }}
      frameloop='always'
      onCreated={(state) => {
        state.gl.setClearColor(new THREE.Color(0x000000), 0);
      }}
    >
      <Suspense fallback={null}>
        <Stats />
        <SceneLights />
        <BackgroundTone />

        <ClustersScene layout='arrow' />
        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <CameraRig />
        <CameraShake intensity={0.3} />

        <PostFX />

        <Stars radius={100} depth={1} count={5000} factor={2} saturation={0} fade speed={2} />
      </Suspense>
    </Canvas>
  );
};

export default R3FCanvas;
