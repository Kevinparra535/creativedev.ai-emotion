import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, PerformanceMonitor } from '@react-three/drei';
import UniverseScene from '../scene/UniverseScene';

export default function UniverseCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 55], fov: 50 }}>
      <PerformanceMonitor />
      <color attach='background' args={['#0b1020']} />
      <ambientLight intensity={0.6} />
  <directionalLight position={[20, 30, 10]} intensity={1} />
      <UniverseScene />
      <OrbitControls makeDefault />
      <Stats />
    </Canvas>
  );
}
