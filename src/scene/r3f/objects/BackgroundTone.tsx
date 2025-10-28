import { useRef } from 'react';
import { useFrame,useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useUniverse } from '@/state/universe.store';

const BackgroundTone = () => {
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
};

export default BackgroundTone;
