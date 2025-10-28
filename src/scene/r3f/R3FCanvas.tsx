import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useEffect } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';
import { CameraControls, PerspectiveCamera, Stars, Stats } from '@react-three/drei';

import ClustersScene from './ClustersScene';
import { useUIStore } from '@/stores/uiStore';
import SceneLights from './objects/SceneLights';
import PostFX from './components/PostFX';
import BackgroundTone from './objects/BackgroundTone';

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
        <SceneLights />
        <BackgroundTone />

        <ClustersScene layout='arrow' />
        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <CameraRig />
        {/* <CameraShake intensity={0.2} /> */}

        <PostFX />

        <Stars radius={100} depth={1} count={5000} factor={2} saturation={0} fade speed={2} />
      </Suspense>
    </Canvas>
  );
};

function CameraRig() {
  const controlsRef = useRef<any>(null);
  const focus = useUIStore((s) => s.cameraFocus);
  const clear = useUIStore((s) => s.clearFocus);

  // Render controls
  // Note: we render CameraControls and react to store to drive setLookAt
  useFrame(() => {
    // noop, ensure hook keeps running
  });

  // Respond to focus requests
  useEffect(() => {
    if (!focus || !controlsRef.current) return;
    const ctrls = controlsRef.current as import('@react-three/drei').CameraControls;
    const [tx, ty, tz] = focus.target;
    const dist = typeof focus.distance === 'number' ? Math.max(2, focus.distance) : 12;
    // Position the camera on the +Z axis looking at target
    const px = tx;
    const py = ty;
    const pz = tz + dist;
    // Smooth move
    ctrls.setLookAt(px, py, pz, tx, ty, tz, true);
    // optional: damp more strongly
    // ctrls.smoothTime = 0.8;
    clear();
  }, [focus, clear]);

  return <CameraControls ref={controlsRef as any} maxDistance={100} />;
}
export default R3FCanvas;
