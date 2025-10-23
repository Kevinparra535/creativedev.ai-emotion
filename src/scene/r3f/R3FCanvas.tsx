import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import { Effects, OrbitControls, OrthographicCamera, BakeShadows } from '@react-three/drei';
import EmotionCluster from './EmotionCluster';

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
        <color attach='background' args={['#202030']} />
        <fog attach='fog' args={['#202030', 10, 25]} />
        <hemisphereLight intensity={0.2} color='#eaeaea' groundColor='blue' />
        <directionalLight
          castShadow
          intensity={0.2}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
          position={[10, 10, -10]}
        />

        <EmotionCluster name='Alegría' color='#FFD54F' position={[2, 1, 0]} />
        <EmotionCluster name='Tristeza' color='#64B5F6' position={[-3, -1, 0]} />
        <EmotionCluster name='Ira' color='#E57373' position={[0, 2, 1]} />
        <EmotionCluster name='Amor' color='#F06292' position={[0, 0, -3]} />

        <Effects disableGamma>
          <unrealBloomPass threshold={1} strength={1} radius={0.5} />
        </Effects>
        <BakeShadows />
        {/* <OrthographicCamera makeDefault far={100} near={0.1} position={[0, -50, 1]} zoom={110} />
        <OrbitControls autoRotate enableZoom={false} /> */}
      </Suspense>
    </Canvas>
  );
};

export default R3FCanvas;
