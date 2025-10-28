import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

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
import { OrbitingSatellite, OrbitLine } from './objects/Orbits';

import { useUIStore } from '@/stores/uiStore';
import { useUniverse } from '@/state/universe.store';

import config from '@/config/config';

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

  // Consume universe data (emotions/links/layout) without altering current visuals
  // Subscribe to store slices separately to avoid creating a new object each render
  const emotions = useUniverse((s) => s.emotions);
  const links = useUniverse((s) => s.links);
  // const universeLayout = useUniverse((s) => s.layout);

  // Derive per-cluster weights from injected universe emotions (for future use)
  const { clusterWeights, maxClusterWeight } = useMemo(() => {
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
    let max = 0;
    for (const v of map.values()) max = Math.max(max, v);
    return { clusterWeights: map, maxClusterWeight: max || 1 };
  }, [clusters, emotions]);
  // Keep latest derived weights in a ref for future steps (consumes universe data without altering visuals)
  const clusterWeightsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    clusterWeightsRef.current = clusterWeights;
  }, [clusterWeights]);

  const timeRef = useRef(0);
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

  // Compute dynamic blended planet from current emotions
  const blend = useMemo(() => {
    if (!emotions || emotions.length === 0)
      return null as null | {
        colors: string[];
        pos: THREE.Vector3;
        label: string;
        intensity: number;
      };
    // Collect colors (colorHex or cluster colorA) and find centroid from cluster positions
    const seen = new Set<string>();
    const cols: string[] = [];
    const pos = new THREE.Vector3();
    let ccount = 0;
    let totalIntensity = 0;
    for (const e of [...emotions].sort((a, b) => (b.intensity ?? 0.6) - (a.intensity ?? 0.6))) {
      const k = clusterKeyForLabel(e.label);
      if (!k) continue;
      const idx = clusters.findIndex((c) => c.key === k);
      if (idx >= 0) {
        pos.add(mainPositions[idx]);
        ccount++;
      }
      const keyUniq = `${e.label.toLowerCase()}`;
      if (!seen.has(keyUniq)) {
        cols.push(e.colorHex ?? clusters[idx >= 0 ? idx : 0].colors[0]);
        seen.add(keyUniq);
      }
      totalIntensity += e.intensity ?? 0.6;
    }
    if (ccount > 0) pos.multiplyScalar(1 / ccount);
    // Pull slightly forward in Z during intro so it’s visible
    pos.z += -2 + (1 - intro.tPlanet) * 8;
    const intensity = Math.min(1, totalIntensity / Math.max(1, emotions.length));
    const label = cols.length ? 'primary blend' : '';
    return { colors: cols, pos, label, intensity };
  }, [emotions, clusters, mainPositions, intro.tPlanet]);

  return (
    <group>
      {/* Dynamic watercolor planet blended from current primary emotions */}
      {blend && blend.colors.length > 0 && (
        <PrimaryBlendPlanet
          position={blend.pos}
          colors={blend.colors}
          label={blend.label}
          radius={1.6 + Math.min(1.4, Math.sqrt(Math.max(0, blend.colors.length - 1)) * 0.18)}
          intensity={blend.intensity}
          speed={0.6}
        />
      )}
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
        // Determine target color for this cluster from strongest matching emotion (fallback to cluster colorA)
        const topEmotion = emotions
          .filter((e) => clusterKeyForLabel(e.label) === c.key)
          .sort((a, b) => (b.intensity ?? 0.5) - (a.intensity ?? 0.5))[0];
        const targetColorHex = topEmotion?.colorHex ?? colorA;
        const weight = clusterWeights.get(c.key) ?? 0;
        const pulseIntensity = Math.min(1, weight / Math.max(0.0001, maxClusterWeight));
        const mainRadius = mainRadii[idx];

        const base = mainPositions[idx];
        const zStart = 140; // behind camera (~100)
        const pos = new THREE.Vector3(
          base.x,
          base.y,
          base.z + (zStart - base.z) * (1 - intro.tPlanet)
        );

        // Satellites driven by universe emotions belonging to this cluster (excluding the primary label)
        const satEmotions = emotions
          .filter(
            (e) =>
              clusterKeyForLabel(e.label) === c.key &&
              e.label.toLowerCase() !== c.label.toLowerCase()
          )
          .sort((a, b) => (b.intensity ?? 0.5) - (a.intensity ?? 0.5));
        // Fallback to synonyms to avoid empty clusters when there is no universe data
        const fallbackLabels: string[] = (
          c.synonyms && c.synonyms.length ? c.synonyms : ['s1', 's2', 's3', 's4']
        ).slice(0, 6);
        const nReal = satEmotions.length;
        const nFallback = fallbackLabels.length;
        const renderFallback = nReal === 0;

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
                : new THREE.Euler(baseEuler.x + incX * 0.6, 0, baseEuler.z + incZ * 0.6, 'XYZ');

            orbitPointsList.push(makeOrbitPoints(pos, a, e, theta, eulerSat, layout));

            const label = fallbackLabels[i];
            const eInt =
              Math.min(1, (clusterWeights.get(c.key) ?? 0) / Math.max(0.0001, maxClusterWeight)) ||
              0.25;
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
          const s = Math.max(0, Math.min(1, (timeRef.current - br.t0) / Math.max(0.001, br.dur)));
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
  );
}
