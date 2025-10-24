import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useUniverse } from '@/state/universe.store';
import { useVisualLeva } from '@/hooks/useVisualLeva';

/*
  NebulaBackground: a large transparent plane behind the scene with a subtle
  FBM noise shader. Color is driven by global valence (warm/cold) and arousal (saturation/intensity).
  It only shows when there are emotions; otherwise it fades out.
*/

export default function NebulaBackground() {
  const emotions = useUniverse((s) => s.emotions);
  const { nebula } = useVisualLeva();
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 1 },
        uValence: { value: 0 }, // [-1..1]
        uArousal: { value: 0 }, // [0..1]
        uOpacity: { value: 0 }, // fades in only when emotions exist
        uIntensityGain: { value: 1 },
        uScale: { value: 1 },
        uWarmLow: { value: new THREE.Color('#ff8fa3') },
        uWarmHigh: { value: new THREE.Color('#ffd166') },
        uColdLow: { value: new THREE.Color('#64b5f6') },
        uColdHigh: { value: new THREE.Color('#7e57c2') }
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
  uniform float uTime;
  uniform float uSpeed;
        uniform float uValence;
        uniform float uArousal;
        uniform float uOpacity;
  uniform float uIntensityGain;
  uniform float uScale;
        uniform vec3 uWarmLow, uWarmHigh, uColdLow, uColdHigh;

        float hash(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p.x + p.y) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        float fbm(vec2 p){
          float v = 0.0;
          float a = 0.5;
          for(int i=0;i<5;i++){
            v += a * noise(p);
            p = mat2(1.6, 1.2, -1.2, 1.6) * p + 0.5;
            a *= 0.5;
          }
          return v;
        }

        void main(){
          vec2 uv = vUv;
          vec2 p = (uv - 0.5);
          float r = length(p);
          float t = uTime * 0.02 * uSpeed;
          float s = max(0.2, uScale);
          float n = fbm(uv * (2.0 * s) + vec2(t * 0.8, -t * 0.6)) * 0.6 +
                    fbm(uv * (4.0 * s) - vec2(t * 0.3,  t * 0.5)) * 0.4;

          // radial fade: strong in center, subtle at edges
          float vign = smoothstep(0.9, 0.2, r);
          float mask = n * vign;

          float v = clamp((uValence + 1.0) * 0.5, 0.0, 1.0);
          vec3 warm = mix(uWarmLow, uWarmHigh, v);
          vec3 cold = mix(uColdLow, uColdHigh, 1.0 - v);
          vec3 base = mix(cold, warm, v);

          float intensity = mix(0.06, 0.18, clamp(uArousal, 0.0, 1.0)) * uIntensityGain;
          vec3 neb = base * mask * intensity;
          gl_FragColor = vec4(neb, uOpacity * clamp(mask, 0.0, 1.0));
        }
      `
    });
  }, []);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value += delta;
    u.uSpeed.value = nebula.speed;
    u.uScale.value = nebula.scale;
    u.uIntensityGain.value = nebula.intensityGain;

    // compute weighted global valence/arousal
    let val = 0;
    let aro = 0;
    let wSum = 0;
    for (const e of emotions) {
      const w = e.intensity ?? 0.6;
      wSum += w;
      val += w * e.valence;
      aro += w * (e.arousal ?? 0.5);
    }
    val = wSum > 0 ? val / wSum : 0;
    aro = wSum > 0 ? aro / wSum : 0;

    // Smoothly approach targets
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    u.uValence.value = lerp(u.uValence.value, val, Math.min(1, delta * 0.8));
    u.uArousal.value = lerp(u.uArousal.value, aro, Math.min(1, delta * 0.8));

    // Fade in only if we have emotions
    const targetOpacity = emotions.length > 0 && nebula.enabled ? nebula.opacity : 0;
    u.uOpacity.value = lerp(u.uOpacity.value, targetOpacity, Math.min(1, delta * 1.2));
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -40]} renderOrder={-10}>
      <planeGeometry args={[400, 220, 1, 1]} />
      <primitive ref={matRef} object={material} attach='material' />
    </mesh>
  );
}
