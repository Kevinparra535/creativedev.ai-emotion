import { Canvas, extend } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import { CameraControls, PerspectiveCamera, Stars, Text } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import ClustersScene from './ClustersScene';

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
      camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 6] }}
      frameloop='always'
      onCreated={(state) => {
        state.gl.setClearColor(new THREE.Color(0x000000), 0);
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[2, 3, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-2, -3, -5]} intensity={0.8} castShadow />
        {/* Variation A: fixed centers from cluster config */}
        <Text
          position={[0, 3.6, 0]}
          fontSize={0.26}
          color={'#ccd'}
          anchorX='center'
          anchorY='bottom'
        >
          clusters: centers
        </Text>
        <ClustersScene layout='centers' />

        <PerspectiveCamera
          makeDefault
          position={[0.265, 0.672, 17.016]}
          // rotation={[-0.038, 0.064, 0.002]}
        />
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
