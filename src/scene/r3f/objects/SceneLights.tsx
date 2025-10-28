import * as THREE from 'three';

import { useUniverse } from '@/state/universe.store';
import { useUIStore } from '@/stores/uiStore';

const SceneLights = () => {
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
};

export default SceneLights;
