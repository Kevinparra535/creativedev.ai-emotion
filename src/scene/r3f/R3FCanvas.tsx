import { Canvas, extend } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import UniverseScene from './UniverseScene';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';

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
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      dpr={dpr}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 6] }}
      frameloop='always'
      onCreated={(state) => {
        state.gl.setClearColor(new THREE.Color(0x000000), 0);
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[2, 3, 5]} intensity={0.8} castShadow />
        <UniverseScene />
        <OrthographicCamera makeDefault far={100} near={0.1} position={[-10, 2, -10]} zoom={110} />
        <OrbitControls enableZoom={false} />
      </Suspense>
    </Canvas>
  );
};

export default R3FCanvas;
