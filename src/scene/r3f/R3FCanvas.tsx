import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

type Props = {
  name?: string;
  color?: string | number;
  position?: [number, number, number];
};

const EmotionCluster = ({ name, color, position }: Props) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.2;
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={0.6} color={color} />
      </mesh>

      {/* Halo energético */}
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

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
        state.gl.setClearColor(new THREE.Color(0x000000), 0); // transparent bg
      }}
    >
      {/* Transparent background */}
      {/* <color attach='background' args={[0x000000]} /> set via setClearColor */}

      <Suspense fallback={null}>
        {/* Demo content; replace with your scene */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[2, 3, 5]} intensity={0.7} castShadow />
        <mesh rotation={[0.2, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color={'#ffffff'} metalness={0.2} roughness={0.4} />
        </mesh>

        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.25} />
        </mesh>

        <EmotionCluster name='Alegría' color='#FFD54F' position={[2, 1, 0]} />
        <EmotionCluster name='Tristeza' color='#64B5F6' position={[-3, -1, 0]} />
        <EmotionCluster name='Ira' color='#E57373' position={[0, 2, 1]} />
        <EmotionCluster name='Amor' color='#F06292' position={[0, 0, -3]} />
      </Suspense>
    </Canvas>
  );
};

export default R3FCanvas;
