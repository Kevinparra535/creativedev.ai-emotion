import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import { getClusters, clusterKeyForLabel } from '@/config/emotion-clusters';

import {
  makeOrbitPoints,
  makeArcPoints,
  gradientColors,
  linkWidthForKind,
  relaxMainPositions,
  computePrimaryEnergyLinks,
  jitterZ,
  type ClustersLayout as UtilLayout,
  type EnergyLinkAgg
} from '@/utils/sceneUtils';

import { Planet, EnergyPulse, PrimaryBlendPlanet } from './objects/Planets';
import { OrbitingSatellite, OrbitLine, BlendOrbitingSatellite } from './objects/Orbits';

import { useUniverse } from '@/state/universe.store';
import { useBlendLeva } from '@/hooks/useBlendLeva';
import { useEmotionVisuals2 } from '@/hooks/useEmotionVisuals2';
import { useUIStore } from '@/stores/uiStore';

import config from '@/config/config';
import AudioManager from '@/audio/AudioManager';

export type ClustersLayout = UtilLayout;
export type PairProps = Map<
  string,
  {
    key: string;
    aIndex: number;
    bIndex: number;
    colA: string;
    colB: string;
    t0: number;
    dur: number;
  }
>;
// Pulsing "neuron" traveling along a quadratic bezier from A -> B

export default function ClustersScene(props: Readonly<{ layout?: ClustersLayout }>) {
  const {
    PLANET_DUR,
    SAT_DELAY,
    SAT_DUR,
    ORBIT_DELAY,
    ORBIT_DUR,
    ENERGY_DELAY,
    ENERGY_DUR,
    CENTER_SCALE
  } = config;

  const { layout = 'centers' } = props;
  const clusters = useMemo(() => getClusters(), []);
  const thinking = useUIStore((s) => s.thinking);
  const { camera, size } = useThree();

  // Consume universe data (emotions/links/layout) without altering current visuals
  // Subscribe to store slices separately to avoid creating a new object each render
  const emotions = useUniverse((s) => s.emotions);
  const links = useUniverse((s) => s.links);
  // const universeLayout = useUniverse((s) => s.layout);

  // Derive per-cluster weights from injected universe emotions (for future use)
  const { clusterWeights } = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clusters) map.set(c.key, 0);
    for (const e of emotions) {
      const k = clusterKeyForLabel(e.label);
      if (!k) continue;
      const prev = map.get(k) ?? 0;
      const w =
        typeof (e as any).intensity === 'number'
          ? (e as any).intensity
          : ((e as any).score ?? 0.5);
      map.set(k, prev + w);
    }
    // keep weights for potential future use (clusters stay visually static regardless)
    return { clusterWeights: map };
  }, [clusters, emotions]);
  // Keep latest derived weights in a ref for future steps (consumes universe data without altering visuals)
  const clusterWeightsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    clusterWeightsRef.current = clusterWeights;
  }, [clusterWeights]);

  const timeRef = useRef(0);
  // Blend planet appear animation state
  const blendAppearStartRef = useRef<number | null>(null);
  const blendAnimActiveRef = useRef(false);
  const blendSoundPlayedRef = useRef(false);
  const blendGroupRef = useRef<THREE.Group>(null);
  // Other galaxies (clusters) disappear animation state
  const clustersGroupRef = useRef<THREE.Group>(null);
  const clustersDisappearStartRef = useRef<number | null>(null);
  const clustersAnimActiveRef = useRef(false);
  const clustersRemovedRef = useRef(false);
  const blinkRef = useRef<{ activeIdx: number | null; t0: number; dur: number; next: number }>({
    activeIdx: null,
    t0: 0,
    dur: 0.25,
    next: 0
  });
  // Ephemeral pair currents
  const pairCurrentsRef = useRef<PairProps>(new Map());
  // Track first-seen timestamp for satellites to animate their appearance
  const appearRef = useRef<Map<string, number>>(new Map());

  // Layout spreads for 'affect' mapping
  const spreadX = 7.5; // slightly larger to reduce collisions on affect layout
  const spreadY = 6.8;

  // Precompute base positions per layout
  const bases = useMemo(() => {
    if (layout === 'centers') {
      return clusters.map((c) => new THREE.Vector3(c.center[0], c.center[1], c.center[2]));
    }
    if (layout === 'affect') {
      return clusters.map(
        (c, idx) =>
          new THREE.Vector3(c.valence * spreadX, (c.arousal - 0.5) * spreadY, jitterZ(idx))
      );
    }
    // Custom 'arrow' layout
    const map = new Map<string, THREE.Vector3>();
    const X = 6;
    const Y = 6;
    const tip = 1.4;
    const ZG = 2.5;
    // Positives (up)
    map.set('love', new THREE.Vector3(0, Y + tip, +ZG));
    map.set('calm', new THREE.Vector3(-X, Y, +ZG));
    map.set('joy', new THREE.Vector3(+X, Y, +ZG));
    // Neutrals (mid)
    map.set('nostalgia', new THREE.Vector3(-X * 0.6, 0, 0));
    map.set('surprise', new THREE.Vector3(+X * 0.6, 0, 0));
    // Negatives (down)
    map.set('anger', new THREE.Vector3(0, -Y - tip, -ZG));
    map.set('sadness', new THREE.Vector3(-X, -Y, -ZG));
    map.set('fear', new THREE.Vector3(+X, -Y, -ZG));

    return clusters.map((c) => map.get(c.key) ?? new THREE.Vector3());
  }, [clusters, layout]);

  // Main radii for each cluster
  const mainRadii = useMemo(() => clusters.map((c) => 0.95 + (c.radius - 2.5) * 0.15), [clusters]);
  // Satellite ring radii per cluster
  const ringRadii = useMemo(() => clusters.map((c) => c.radius * 1.85), [clusters]);
  // Bounding radii per cluster for non-overlap
  const boundRadii = useMemo(
    () => clusters.map((_, i) => mainRadii[i] + ringRadii[i] + 0.9),
    [clusters, mainRadii, ringRadii]
  );

  // Relax main planets to avoid overlaps between clusters
  const mainPositions = useMemo(
    () => relaxMainPositions(bases, boundRadii, layout, CENTER_SCALE),
    [bases, boundRadii, layout, CENTER_SCALE]
  );

  // Intro timeline
  const [intro, setIntro] = useState({ tPlanet: 0, tSat: 0, tOrbit: 0, tEnergy: 0 });
  const introStartRef = useRef<number | null>(null);
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  useFrame((state) => {
    const nowMs = performance.now();
    const now = nowMs;
    timeRef.current = state.clock.elapsedTime;
    if (introStartRef.current == null) introStartRef.current = now;
    const elapsed = (now - introStartRef.current) / 1000;

    const tPlanet = easeOutCubic(clamp01(elapsed / PLANET_DUR));
    const tSat = easeOutCubic(clamp01((elapsed - SAT_DELAY) / SAT_DUR));
    const tOrbit = easeOutCubic(clamp01((elapsed - ORBIT_DELAY) / ORBIT_DUR));
    const tEnergy = easeOutCubic(clamp01((elapsed - ENERGY_DELAY) / ENERGY_DUR));

    setIntro((prev) => {
      if (
        prev.tPlanet === tPlanet &&
        prev.tSat === tSat &&
        prev.tOrbit === tOrbit &&
        prev.tEnergy === tEnergy
      )
        return prev;
      return { tPlanet, tSat, tOrbit, tEnergy };
    });

    // Handle random blink sequence during thinking
    const br = blinkRef.current;
    const nowSec = state.clock.elapsedTime;

    if (thinking) {
      // Activate a random planet when time passes next threshold
      if (br.activeIdx == null && nowSec >= br.next) {
        br.activeIdx = Math.floor(Math.random() * clusters.length);
        br.t0 = nowSec;
        br.dur = 0.22 + Math.random() * 0.18; // 0.22..0.40s
        br.next = br.t0 + br.dur + (0.08 + Math.random() * 0.22); // small gap
      } else if (br.activeIdx != null && nowSec - br.t0 > br.dur) {
        br.activeIdx = null;
      }
    } else {
      br.activeIdx = null;
      br.next = nowSec + 0.2;
    }

    // Drive blend planet appear animation (delayed bounce-in)
    if (blend) {
      if (blendAppearStartRef.current == null) {
        // schedule start ~500ms after blend becomes available
        blendAppearStartRef.current = now + 300;
        blendAnimActiveRef.current = true;
        blendSoundPlayedRef.current = false;
      }
      if (blendAnimActiveRef.current && blendAppearStartRef.current != null) {
        const start = blendAppearStartRef.current;
        if (now >= start && !blendSoundPlayedRef.current) {
          // optional: play blop one-shot
          if (
            (config as any).AUDIO?.BLEND_APPEAR_ENABLED &&
            (config as any).AUDIO?.BLEND_APPEAR_URL
          ) {
            AudioManager.resumeOnInteraction();
            AudioManager.playOneShot(
              (config as any).AUDIO.BLEND_APPEAR_URL,
              (config as any).AUDIO?.BLEND_APPEAR_DETUNE_CENTS ?? 0
            );
          }
          blendSoundPlayedRef.current = true;
        }
        // compute and apply scale with a rubber-like easeOutBack curve
        const elapsed = Math.max(0, now - start);
        const dur = 1100; // ms (more relaxed)
        const t = Math.max(0, Math.min(1, elapsed / dur));
        const c1 = 0.7;
        const c3 = c1 + 1;
        const eob = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        const minScale = 0.6;
        const s = minScale + (1 - minScale) * eob;
        const scale = Math.max(0.001, Math.min(1, s));
        if (blendGroupRef.current) {
          blendGroupRef.current.scale.set(scale, scale, scale);
        }
        if (elapsed > dur + 300) {
          // allow a little extra time after anim then stop updating
          blendAnimActiveRef.current = false;
        }
      }
    } else {
      // reset if blend disappears
      blendAppearStartRef.current = null;
      blendAnimActiveRef.current = false;
      blendSoundPlayedRef.current = false;
    }

    // Animate disappearance of other galaxies when blend is present
    if (blend) {
      if (!clustersRemovedRef.current) {
        if (clustersDisappearStartRef.current == null) {
          clustersDisappearStartRef.current =
            now + ((config as any).CLUSTERS_DISAPPEAR_DELAY_MS ?? 120);
          clustersAnimActiveRef.current = true;
        }
      }
      if (
        clustersAnimActiveRef.current &&
        clustersGroupRef.current &&
        clustersDisappearStartRef.current != null
      ) {
        const start = clustersDisappearStartRef.current;
        const elapsedMs = now - start;
        const dur = (config as any).CLUSTERS_DISAPPEAR_DUR_MS ?? 1000;
        let scale = 1;
        if (elapsedMs >= 0) {
          const t = Math.max(0, Math.min(1, elapsedMs / dur));
          // smoother ease-in cubic shrink, keeps them in place and less noticeable
          const inCubic = t * t * t;
          scale = Math.max(0.001, Math.min(1, 1 - inCubic));
        }
        clustersGroupRef.current.scale.set(scale, scale, scale);
        if (elapsedMs > dur + 200) {
          clustersAnimActiveRef.current = false;
          clustersRemovedRef.current = true; // unmount for performance via conditional render
        }
      }
    } else {
      // if blend is gone, restore clusters
      clustersDisappearStartRef.current = null;
      clustersAnimActiveRef.current = false;
      clustersRemovedRef.current = false;
      if (clustersGroupRef.current) clustersGroupRef.current.scale.set(1, 1, 1);
    }
  });

  useEffect(() => {
    console.log(emotions);
  }, [emotions]);

  // Spawn ephemeral "electric current" pair arcs whenever links update
  useEffect(() => {
    if (!links || links.length === 0) return;
    // Build a quick index emotionId -> label
    const emoById = new Map(emotions.map((e) => [e.id, e] as const));
    // Take top 5 links by weight and create ephemeral entries
    const top = [...links]
      .filter((l) => l.source && l.target && l.source !== l.target)
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, 5);
    const now = timeRef.current;
    for (const l of top) {
      const se = emoById.get(l.source);
      const te = emoById.get(l.target);
      const sLabel = se?.label ?? String(l.source);
      const tLabel = te?.label ?? String(l.target);
      const sKey = clusterKeyForLabel(sLabel);
      const tKey = clusterKeyForLabel(tLabel);
      if (!sKey || !tKey || sKey === tKey) continue;
      const aIndex = clusters.findIndex((c) => c.key === sKey);
      const bIndex = clusters.findIndex((c) => c.key === tKey);
      if (aIndex < 0 || bIndex < 0) continue;
      const colA = clusters[aIndex].colors[0] ?? '#ffffff';
      const colB = clusters[bIndex].colors[0] ?? '#ffffff';
      const baseKey = `${sKey}->${tKey}`;
      const key = `${baseKey}-${Math.round(now * 1000)}-${Math.floor(Math.random() * 9999)}`;
      // 0.9..1.4s lifespan depending on weight
      const dur = 0.9 + Math.min(0.5, (l.weight ?? 0.5) * 0.9);
      pairCurrentsRef.current.set(key, { key, aIndex, bIndex, colA, colB, t0: now, dur });
      // Cap to avoid unbounded growth
      if (pairCurrentsRef.current.size > 24) {
        const firstKey = pairCurrentsRef.current.keys().next().value;
        if (firstKey) pairCurrentsRef.current.delete(firstKey);
      }
    }
  }, [links, emotions, clusters]);

  // Energy links only between main planets (primary emotions)
  const energyLinks = useMemo<EnergyLinkAgg[]>(
    () => computePrimaryEnergyLinks(clusters),
    [clusters]
  );

  const showDefaultLinks = !thinking && links.length === 0;
  const showPairCurrents = links.length > 0;
  // Blend quality controls
  const { segments: blendSegments, sharpness: blendSharpness } = useBlendLeva();
  // Emotion Visuals 2.0 controls
  const { planetConfig: ev2 } = useEmotionVisuals2();
  const focusOn = useUIStore((s) => s.focusOn);
  const didFocusRef = useRef(false);

  // Compute dynamic blended planet from current emotions
  const blend = useMemo(() => {
    if (!emotions || emotions.length === 0)
      return null as null | {
        colors: string[];
        pos: THREE.Vector3;
        label: string;
        intensity: number;
      };
    // Collect colors (colorHex o colorA del cluster)
    const seen = new Set<string>();
    const cols: string[] = [];
    // Posición fija: origen del mapa (0,0,0)
    const pos = new THREE.Vector3(0, 0, 0);
    let totalIntensity = 0;
    for (const e of [...emotions].sort((a, b) => (b.intensity ?? 0.6) - (a.intensity ?? 0.6))) {
      const k = clusterKeyForLabel(e.label);
      if (!k) continue;
      const idx = clusters.findIndex((c) => c.key === k);
      const keyUniq = `${e.label.toLowerCase()}`;
      if (!seen.has(keyUniq)) {
        cols.push(e.colorHex ?? clusters[idx >= 0 ? idx : 0].colors[0]);
        seen.add(keyUniq);
      }
      totalIntensity += e.intensity ?? 0.6;
    }
    // Pull ligeramente hacia cámara durante la intro para asegurar visibilidad
    pos.z += -2 + (1 - intro.tPlanet) * 8;
    const intensity = Math.min(1, totalIntensity / Math.max(1, emotions.length));
    const label = cols.length ? 'primary blend' : '';
    return { colors: cols, pos, label, intensity };
  }, [emotions, clusters, mainPositions, intro.tPlanet]);

  // Reset the blend appear animation when the emotion mix changes significantly
  const blendKey = useMemo(() => {
    return blend ? `${blend.colors.join('|')}|${blend.label}` : '';
  }, [blend]);

  useEffect(() => {
    if (!blend) return;
    // Reset the animation so it replays on every new payload
    blendAppearStartRef.current = null;
    blendAnimActiveRef.current = false;
    blendSoundPlayedRef.current = false;
    // also reset scale immediately
    if (blendGroupRef.current) {
      blendGroupRef.current.scale.set(0.001, 0.001, 0.001);
    }
  }, [blendKey, blend]);

  // (moved below satellites memo)

  // Build relation satellites for the central blend planet
  const blendSatellites = useMemo(() => {
    if (!emotions || emotions.length === 0)
      return [] as Array<{
        label: string;
        colors: string[];
      }>;
    const acc = new Map<string, Set<string>>();
    for (const e of emotions) {
      const relations = (e.meta as any)?.relations as string[] | undefined;
      if (!relations || relations.length === 0) continue;
      // color of the container emotion (where satellite appears)
      const parentColor =
        e.colorHex ??
        (() => {
          const k = clusterKeyForLabel(e.label);
          const idx = k ? clusters.findIndex((c) => c.key === k) : -1;
          return clusters[idx >= 0 ? idx : 0].colors[0];
        })();
      for (const r of relations) {
        const key = r.toLowerCase();
        let set = acc.get(key);
        if (!set) {
          set = new Set<string>();
          acc.set(key, set);
        }
        set.add(parentColor);
      }
    }
    const out: Array<{ label: string; colors: string[] }> = [];
    for (const [label, set] of acc.entries()) {
      const colors = Array.from(set).slice(0, 6); // cap to 6 for clarity
      if (colors.length > 0) out.push({ label, colors });
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [emotions, clusters]);

  // Trigger a camera focus to frame the blend system (planet + orbits + satellites)
  useEffect(() => {
    if (!blend || didFocusRef.current) return;
    if (intro.tPlanet <= 0.6) return; // wait a bit into the intro so it's on-screen

    // Estimate a bounding radius that encloses the full blend system:
    // - central planet radius (depends on color count)
    // - max ellipse extent a*(1+e)
    // - largest satellite radius
    // - small visual margin
    const a = 4.6; // base semi-major axis used for blend satellites
    const e = 0.14;
    const centralR =
      1.6 + Math.min(1.4, Math.sqrt(Math.max(0, (blend.colors.length ?? 0) - 1)) * 0.18);
    const maxSatR = (blendSatellites || []).reduce((m, s) => {
      const r = Math.max(0.32, 0.38 + 0.06 * Math.max(0, (s.colors?.length ?? 1) - 1));
      return Math.max(m, r);
    }, 0.4);
    const orbitMax = a * (1 + e) + maxSatR;
    const R = Math.max(centralR, orbitMax) + 0.8; // margin

    // Compute camera distance to fit R in view given current FOV and aspect
    const persp = camera as THREE.PerspectiveCamera;
    const vfovDeg = persp && (persp as any).isPerspectiveCamera ? persp.fov : 45;
    const vfov = (vfovDeg * Math.PI) / 180;
    const aspect = size.width > 0 && size.height > 0 ? size.width / size.height : 16 / 9;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const distV = R / Math.tan(vfov / 2);
    const distH = R / Math.tan(hfov / 2);
    const distance = Math.max(distV, distH);

    didFocusRef.current = true;
    focusOn({ target: [blend.pos.x, blend.pos.y, blend.pos.z], distance });
  }, [blend, blendSatellites, intro.tPlanet, focusOn, camera, size]);

  // Helper to build a multi-stop gradient across N control colors for a path of given length
  const gradientColorsMulti = (stops: string[], count: number): THREE.Color[] => {
    if (stops.length <= 1) {
      const c = new THREE.Color(stops[0] ?? '#ffffff');
      return Array.from({ length: count }, () => c.clone());
    }
    const cols = stops.map((h) => new THREE.Color(h));
    const segs = cols.length - 1;
    const out: THREE.Color[] = [];
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
      const s = Math.min(segs - 1, Math.floor(t * segs));
      const localT = segs === 0 ? 0 : t * segs - s;
      out.push(cols[s].clone().lerp(cols[s + 1], localT));
    }
    return out;
  };

  return (
    <group>
      {/* Dynamic watercolor planet blended from current primary emotions */}
      {blend && blend.colors.length > 0 && (
        <group ref={blendGroupRef} position={blend.pos}>
          <PrimaryBlendPlanet
            key={`blend-${blend.colors.join('-')}-${ev2.effect}-${blendSegments}-${blendSharpness}`}
            position={[0, 0, 0]}
            colors={blend.colors}
            label={blend.label}
            radius={1.6 + Math.min(1.4, Math.sqrt(Math.max(0, blend.colors.length - 1)) * 0.18)}
            intensity={Math.max(0, Math.min(1, ev2.bounce))}
            speed={0.6}
            segments={blendSegments}
            sharpness={blendSharpness}
            spinSpeed={ev2.spinSpeed}
            effect={ev2.effect}
            wcWash={ev2.wcWash}
            wcScale={ev2.wcScale}
            wcFlow={ev2.wcFlow}
            wcSharpness={ev2.wcSharpness}
            oilSwirl={ev2.oilSwirl}
            oilScale={ev2.oilScale}
            oilFlow={ev2.oilFlow}
            oilShine={ev2.oilShine}
            oilContrast={ev2.oilContrast}
          />
        </group>
      )}
      {/* Blend planet satellites based on relations */}
      {blend && blendSatellites.length > 0 && (
        <group>
          {(() => {
            const center = blend.pos.clone();
            const N = blendSatellites.length;
            // Increase base ring radius for more separation from the central blend planet
            const baseA = 4.6; // larger ring radius to reduce overlaps
            const e = 0.14; // mild eccentricity
            const tilt = new THREE.Euler(0.25, 0, 0.15, 'XYZ');
            const satSegments = Math.max(32, Math.round(blendSegments * 0.5));
            const sats = [] as any[];
            for (let i = 0; i < N; i++) {
              const s = blendSatellites[i];
              // Slight radial jitter + progressive spacing per index
              const a = baseA + Math.sin(i * 1.234) * 0.35 + (i % 5) * 0.18;
              const theta = i * 0.31 + 0.5; // in-plane rotation
              const phase0 = (i / Math.max(1, N)) * Math.PI * 2; // even start
              const speed = 0.18 + 0.04 * Math.sin(i * 0.77);
              const label = s.label;
              // Slightly increase min radius for clearer visual separation
              const r = Math.max(0.32, 0.38 + 0.06 * (s.colors.length - 1));

              // Orbit line with multi-stop gradient reflecting the satellite's color composition
              const orbitPts = makeOrbitPoints(center, a, e, theta, tilt, layout, 96);
              const vColors = gradientColorsMulti(s.colors, orbitPts.length);
              sats.push(
                <Line
                  key={`blend-orbit-${label}-${i}`}
                  points={orbitPts}
                  vertexColors={vColors}
                  transparent
                  opacity={0.22 * intro.tOrbit}
                  depthWrite={false}
                  lineWidth={1}
                  visible={intro.tOrbit > 0.02}
                />
              );
              sats.push(
                <BlendOrbitingSatellite
                  key={`blend-sat-${label}-${i}-${s.colors.join('-')}`}
                  center={center}
                  a={a}
                  e={e}
                  theta={theta}
                  euler={tilt}
                  layout={layout}
                  phase0={phase0}
                  speed={speed}
                  introZOffset={(1 - intro.tPlanet) * 80}
                  introScale={0.6 + 0.4 * intro.tSat}
                  blend={{
                    colors: s.colors,
                    label,
                    radius: r,
                    segments: satSegments,
                    sharpness: blendSharpness,
                    spinSpeed: ev2.spinSpeed,
                    intensity: Math.max(0, Math.min(1, ev2.bounce * 0.8)),
                    effect: ev2.effect,
                    wcWash: ev2.wcWash,
                    wcScale: ev2.wcScale,
                    wcFlow: ev2.wcFlow,
                    wcSharpness: ev2.wcSharpness,
                    oilSwirl: ev2.oilSwirl,
                    oilScale: ev2.oilScale,
                    oilFlow: ev2.oilFlow,
                    oilShine: ev2.oilShine,
                    oilContrast: ev2.oilContrast
                  }}
                />
              );
            }
            return sats;
          })()}
        </group>
      )}
      {/* Other galaxies (clusters + links + pair currents) shrink and are removed when blend is active */}
      {!clustersRemovedRef.current && (
        <group ref={clustersGroupRef}>
          {/* Energy links between main planets (only primaries). Hidden while thinking or when backend pairs are present. */}
          <group visible={showDefaultLinks}>
            {energyLinks.map((el, i) => {
              const zStart = 140; // behind camera (~100)
              const aBase = mainPositions[el.aIndex];
              const bBase = mainPositions[el.bIndex];
              const aPos = new THREE.Vector3(
                aBase.x,
                aBase.y,
                aBase.z + (zStart - aBase.z) * (1 - intro.tPlanet)
              );
              const bPos = new THREE.Vector3(
                bBase.x,
                bBase.y,
                bBase.z + (zStart - bBase.z) * (1 - intro.tPlanet)
              );
              const { points, ctrl } = makeArcPoints(aPos, bPos, 0.28, 72, layout);
              const colA = el.colA;
              const colB = el.colB;
              const vColors = gradientColors(colA, colB, points.length);
              const baseOpacity = Math.min(0.9, 0.22 + el.weight * 0.5);
              const opacity = baseOpacity * intro.tEnergy;
              const width = linkWidthForKind(el.kind);

              const key = `energy-${el.kind}-${el.aIndex}-${el.bIndex}-${i}`;
              return (
                <group key={key}>
                  <Line
                    points={points}
                    vertexColors={vColors}
                    lineWidth={width}
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                    visible={intro.tEnergy > 0.02}
                  />
                  {intro.tEnergy > 0.5 && (
                    <>
                      <EnergyPulse
                        a={aPos}
                        b={bPos}
                        ctrl={ctrl}
                        colorA={colA}
                        colorB={colB}
                        speed={0.35 + el.weight * 0.25}
                        size={0.11}
                        phase={(i * 0.17) % 1}
                      />
                      <EnergyPulse
                        a={bPos}
                        b={aPos}
                        ctrl={ctrl}
                        colorA={colB}
                        colorB={colA}
                        speed={0.28 + el.weight * 0.2}
                        size={0.085}
                        phase={(i * 0.41) % 1}
                      />
                    </>
                  )}
                </group>
              );
            })}
          </group>

          {/* Ephemeral pair "electric currents" between clusters based on links from backend */}
          <group visible={showPairCurrents}>
            {[...pairCurrentsRef.current.values()].map((pc) => {
              const aBase = mainPositions[pc.aIndex];
              const bBase = mainPositions[pc.bIndex];
              // Progress and fade-in/out
              const elapsed = timeRef.current - pc.t0;
              const t = Math.max(0, Math.min(1, elapsed / pc.dur));
              if (t >= 1) {
                queueMicrotask(() => pairCurrentsRef.current.delete(pc.key));
                return null;
              }
              const easeInOut = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
              const zStart = 120;
              const aPos = new THREE.Vector3(
                aBase.x,
                aBase.y,
                aBase.z + (zStart - aBase.z) * (1 - intro.tPlanet)
              );
              const bPos = new THREE.Vector3(
                bBase.x,
                bBase.y,
                bBase.z + (zStart - bBase.z) * (1 - intro.tPlanet)
              );
              const { points, ctrl } = makeArcPoints(aPos, bPos, 0.22, 56, layout);
              const vColors = gradientColors(pc.colA, pc.colB, points.length);
              const opacity = 0.35 * easeInOut;
              const width = 0.7;
              return (
                <group key={`pc-${pc.key}`}>
                  <Line
                    points={points}
                    vertexColors={vColors}
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                    lineWidth={width}
                    visible={intro.tPlanet > 0.15}
                  />
                  {/* Fast pulses in both directions to suggest current */}
                  <EnergyPulse
                    a={aPos}
                    b={bPos}
                    ctrl={ctrl}
                    colorA={pc.colA}
                    colorB={pc.colB}
                    speed={0.9}
                    size={0.06}
                    phase={(t * 0.37) % 1}
                  />
                  <EnergyPulse
                    a={bPos}
                    b={aPos}
                    ctrl={ctrl}
                    colorA={pc.colB}
                    colorB={pc.colA}
                    speed={0.8}
                    size={0.05}
                    phase={(t * 0.61) % 1}
                  />
                </group>
              );
            })}
          </group>

          {clusters.map((c, idx) => {
            const colorA = c.colors[0] ?? '#ffffff';
            const colorB = c.colors[1] ?? colorA;
            // Keep default cluster visuals independent of incoming emotion responses
            const targetColorHex = colorA;
            const pulseIntensity = 0.3;
            const mainRadius = mainRadii[idx];

            const base = mainPositions[idx];
            const zStart = 140; // behind camera (~100)
            const pos = new THREE.Vector3(
              base.x,
              base.y,
              base.z + (zStart - base.z) * (1 - intro.tPlanet)
            );

            // Satellites driven by universe emotions belonging to this cluster (excluding the primary label)
            // Always render fallback satellites so clusters keep their default structure
            const satEmotions: any[] = [];
            // Fallback to synonyms to avoid empty clusters; used regardless of universe data
            const fallbackLabels: string[] = (
              c.synonyms && c.synonyms.length ? c.synonyms : ['s1', 's2', 's3', 's4']
            ).slice(0, 6);
            const nReal = 0;
            const nFallback = fallbackLabels.length;
            const renderFallback = true;

            const ringR = ringRadii[idx];
            const seed = (idx + 1) * Math.PI * 0.27;
            const tiltX = Math.sin(seed * 1.3) * 0.45;
            const tiltZ = Math.cos(seed * 0.9) * 0.35;
            const baseEuler = new THREE.Euler(tiltX, 0, tiltZ, 'XYZ');

            const orbitPointsList: THREE.Vector3[][] = [];
            const satellites: Array<{
              id: string;
              label: string;
              a: number;
              e: number;
              theta: number;
              euler: THREE.Euler;
              phase0: number;
              r: number;
              colorA: string;
              colorB: string;
              pulse: number;
            }> = [];

            // Anchor angle towards the strongest neighboring cluster (by derived weight)
            let anchorAngle = seed;
            if (nReal > 0 && emotions.length > 0) {
              let bestIdx = -1;
              let bestW = -Infinity;
              for (let j = 0; j < clusters.length; j++) {
                if (j === idx) continue;
                const w = clusterWeights.get(clusters[j].key) ?? 0;
                if (w > bestW) {
                  bestW = w;
                  bestIdx = j;
                }
              }
              if (bestIdx >= 0) {
                const aBase = mainPositions[idx];
                const bBase = mainPositions[bestIdx];
                const dx = bBase.x - aBase.x;
                const dy = bBase.y - aBase.y;
                anchorAngle = Math.atan2(dy, dx);
              }
            }
            const spreadStep = 0.32; // radians between neighbors around anchor when using real emotions

            // 1) Real emotion satellites clustered around anchor
            for (let i = 0; i < nReal; i++) {
              const tNorm = nReal > 1 ? i / (nReal - 1) : 0;
              const angle = anchorAngle + (i - (nReal - 1) * 0.5) * spreadStep;
              const w = 0.7 - 0.45 * tNorm;
              const baseR = 0.28 + w * 0.22;

              const a = ringR * (0.85 + 0.25 * tNorm);
              const eccSeed = Math.sin((i + 1) * 1.318 + idx * 0.7) * 0.5 + 0.5;
              const e = 0.05 + 0.2 * eccSeed;
              const theta = (seed * 0.6 + i * 0.9) % (Math.PI * 2);

              const maxInc = 0.35;
              const incX = Math.sin(i * 2.13 + idx * 0.77) * 0.5 * maxInc;
              const incZ = Math.cos(i * 1.73 + idx * 0.41) * 0.5 * maxInc;
              const eulerSat =
                layout === 'arrow'
                  ? baseEuler
                  : new THREE.Euler(baseEuler.x + incX * 0.6, 0, baseEuler.z + incZ * 0.6, 'XYZ');

              orbitPointsList.push(makeOrbitPoints(pos, a, e, theta, eulerSat, layout));

              const em = satEmotions[i];
              const label = em.label;
              const eInt = Math.max(0, Math.min(1, em.intensity ?? 0.6));
              const eColor = em.colorHex ?? colorA;
              const r = Math.max(0.18, baseR + eInt * 0.22);

              satellites.push({
                id: em.id,
                label,
                a,
                e,
                theta,
                euler: eulerSat,
                phase0: angle,
                r,
                colorA: eColor,
                colorB: eColor,
                pulse: eInt
              });
            }

            // 2) Fallback satellites evenly distributed ONLY if there are no real emotions
            if (renderFallback) {
              for (let i = 0; i < nFallback; i++) {
                const tNorm = nFallback > 1 ? i / (nFallback - 1) : 0;
                const angle = i * ((Math.PI * 2) / Math.max(1, nFallback)) + seed;
                const w = 0.7 - 0.45 * tNorm;
                const baseR = 0.24 + w * 0.18;

                const a = ringR * (0.85 + 0.25 * tNorm);
                const eccSeed = Math.sin((i + 1) * 1.318 + idx * 0.7) * 0.5 + 0.5;
                const e = 0.05 + 0.2 * eccSeed;
                const theta = (seed * 0.6 + i * 0.9) % (Math.PI * 2);

                const maxInc = 0.35;
                const incX = Math.sin(i * 2.13 + idx * 0.77) * 0.5 * maxInc;
                const incZ = Math.cos(i * 1.73 + idx * 0.41) * 0.5 * maxInc;
                const eulerSat =
                  layout === 'arrow'
                    ? baseEuler
                    : new THREE.Euler(
                        baseEuler.x + incX * 0.6,
                        0,
                        baseEuler.z + incZ * 0.6,
                        'XYZ'
                      );

                orbitPointsList.push(makeOrbitPoints(pos, a, e, theta, eulerSat, layout));

                const label = fallbackLabels[i];
                const eInt = 0.35; // fixed subtle pulse independent of universe data
                const eColor = colorA;
                const r = Math.max(0.16, baseR + eInt * 0.12);

                satellites.push({
                  id: `${c.key}-fb-${i}`,
                  label,
                  a,
                  e,
                  theta,
                  euler: eulerSat,
                  phase0: angle,
                  r,
                  colorA: eColor,
                  colorB: eColor,
                  pulse: eInt * 0.5 // subtler pulse for fallback
                });
              }
            }

            // Compute blink factor for this planet if active
            const br = blinkRef.current;
            let thinkingBlink = 0;
            if (thinking && br.activeIdx === idx) {
              const s = Math.max(
                0,
                Math.min(1, (timeRef.current - br.t0) / Math.max(0.001, br.dur))
              );
              thinkingBlink = Math.sin(s * Math.PI); // smooth in/out
            }

            return (
              <group key={c.key}>
                {orbitPointsList.map((pts, oi) => (
                  <OrbitLine
                    key={`${c.key}-orbit-${oi}`}
                    points={pts}
                    color={targetColorHex}
                    opacityFactor={intro.tOrbit}
                  />
                ))}

                <Planet
                  position={pos}
                  colorA={colorA}
                  colorB={colorB}
                  label={c.label}
                  radius={mainRadius}
                  texturePack={
                    config.TEXTURES.ENABLED && c.key === config.TEXTURES.PLANET_KEY
                      ? config.TEXTURES.PACK
                      : undefined
                  }
                  thinking={thinking}
                  thinkingBlink={thinkingBlink}
                  targetColorHex={targetColorHex}
                  pulseIntensity={pulseIntensity}
                />

                {satellites.map((s, si) => {
                  // Per-emotion appearance animation (~0.6s) when first seen
                  let t0 = appearRef.current.get(s.id);
                  if (t0 == null) {
                    t0 = timeRef.current;
                    appearRef.current.set(s.id, t0);
                  }
                  const appear = Math.max(0, Math.min(1, (timeRef.current - t0) / 0.6));
                  // After the global intro completes, avoid pushing new satellites along Z (they looked far/floaty)
                  const postIntro =
                    intro.tPlanet > 0.999 && intro.tSat > 0.999 && intro.tOrbit > 0.999;
                  // During initial intro, drive satellites by the intro timeline (planet first, then satellites).
                  // After intro, use the per-emotion appear animation only.
                  const satFactor = postIntro ? appear : intro.tSat;
                  const introScale = 0.6 + 0.4 * satFactor;
                  const introZOffset = postIntro ? 0 : (1 - satFactor) * 100;

                  return (
                    <OrbitingSatellite
                      key={`${c.key}-sat-${s.id}`}
                      center={pos}
                      a={s.a}
                      e={s.e}
                      theta={s.theta}
                      euler={s.euler}
                      layout={layout}
                      phase0={s.phase0}
                      speed={0.08 + 0.015 * Math.sin((si + 1) * 1.234 + idx * 0.77)}
                      introZOffset={introZOffset}
                      introScale={introScale}
                      planet={{
                        colorA: s.colorA,
                        colorB: s.colorB,
                        label: s.label,
                        radius: s.r,
                        emissiveIntensity: 0.25 + (s.r - 0.38) * 0.35,
                        hoverEmissive: 0.9 + (s.r - 0.38) * 0.7,
                        interactive: true,
                        thinking,
                        targetColorHex: s.colorA,
                        pulseIntensity: s.pulse
                      }}
                    />
                  );
                })}
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}
