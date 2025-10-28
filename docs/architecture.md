# Architecture (v2)

The app converts text into reactive visuals (DOM and WebGL) based on real-time detected emotions. The service layer allows switching between offline (local heuristic) and online (API) with a single toggle and unifies the pipeline for both DOM and R3F.

## Core stack

- React 19 + TypeScript + Vite (SWC)
- Dual render: DOM (Framer Motion + styled-components) and WebGL with R3F/Drei/Postprocessing
- State: Zustand (UI in `src/stores/*`, domain in `src/state/*`); Controls: Leva
- Lint/Format: ESLint (flat) + Prettier

## End-to-end flow

1) User types in `features/prompt/PromptInput.tsx`.
2) Unified analysis: `useEmotionCoordinator` (debounce + cancel) calls `emotionService.analyzeToGraph(text)` once and derives:
   - Primary `emotion` (by `intensity` or `meta.score`)
   - `{ emotions, links, galaxies }` for the R3F scene
3) The component syncs stores: `useEmotionStore.setCurrent(emotion)` and `useUniverse.setData({ emotions, links, galaxies })`, and sets `useUIStore.setThinking(analyzing)`.
4) DOM: `Vizualizer` applies `emotion-presets`.
5) WebGL: `ClustersScene` renders planets/satellites/links and the Blend Planet.

```mermaid
flowchart LR
  A[PromptInput] -- text --> B[useEmotionCoordinator]
  B -- emotion --> D[Vizualizer (DOM)]
  B -- {emotions,links,galaxies} --> E[ClustersScene/UniverseScene (R3F)]
```

## Analysis modes (factory)

- Toggle: `VITE_EMOTION_MODE = online | offline | auto` (default: auto)
- Factory: `EmotionServiceFactory` exposes `emotionService`:
  - online: `OpenIAAdapter` (API + Zod validation + permissive fallback)
  - offline: `local-emotions` (`buildPayloadFromText`/`localHeuristic`)
  - auto: online if `VITE_OPENAI_API_KEY` present, otherwise offline

## Key modules

- `src/services/EmotionServiceFactory.ts`
  - Common contract: `analyze`, `analyzeMulti`, `analyzeToGraph`
  - Chains rules (`RuleEngine`) and clustering (`ClusterEngine`) for the universe.

- `src/services/OpenIAAdapter.ts`
  - Chat completions → text → JSON
  - Validates with Zod (`PayloadZ`); on failure, permissive parser (`tryParseMulti`), then heuristic fallback.
  - `mapAIToDomain` transforms to `Emotion[]`/`Link[]`.

- `src/ai/local-emotions.ts`
  - `localHeuristic(text)` → normalized dominant emotion
  - `expandFromDominant` and `buildPayloadFromText` → multi payload (emotions + pairs + global)

- `src/services/universeGraph.ts`
  - Builds a graph per phrases: accumulates weights, valence/arousal, co-occurrences and semantic pairs.
  - Affect defaults via `AFFECT_DEFAULTS` (ClusterEngine).

- `src/systems/ClusterEngine.ts`
  - Centralizes affect defaults (valence, arousal, palette) and synonyms from `config/emotion-clusters`.
  - `clusterByPrimaries` creates actual galaxies (love/joy/fear/…)

- `src/systems/GraphBuilder.ts` and `src/systems/RuleEngine.ts`
  - Merges links, helper clustering, and rules (polarity, transitions).

### R3F rendering (galaxies, primaries, Blend Planet)

- `R3FCanvas.tsx`: single canvas with lights, CameraControls, postprocessing (Bloom, Noise, Vignette, Chroma) and adaptive DPR; controls in `useVisualLeva` (PostFX only; Nebula removed).
- `ClustersScene.tsx`: primary planets + satellites; elliptical orbits; energy links with gradients and "neuron pulses"; staged intro; Blend Planet at the centroid of active clusters.
- Objects: `objects/Planets.tsx`, `objects/Orbits.tsx`; utilities under `scene/r3f/utils/*`.
- `UniverseScene.tsx`: alternative for the full graph (nodes/links) when exploring the universe.
- Scene utils: `makeOrbitPoints`, `makeArcPoints`, `gradientColors`, `relaxMainPositions`, `computePrimaryEnergyLinks`.
- Audio: `AudioManager.ts` (ambient + hover SFX), with Leva controls.
- PBR textures: `objects/Planets.tsx` + `utils/planetTextures.ts` apply a pack to a configurable planet with AO/normal/roughness/metalness/optional displacement.

#### Blend Planet + Emotion Visuals 2.0

- `PrimaryBlendPlanet` (in `objects/Planets.tsx`) combines up to 12 colors of active emotions.
- Leva controls (hook `useEmotionVisuals2.ts`):
  - effect: `Watercolor | Oil | Link | Holographic | Voronoi`
  - Watercolor: `wcWash`, `wcScale`, `wcSharpness`, `wcFlow`
  - Oil: `oilSwirl`, `oilScale`, `oilFlow`, `oilShine`, `oilContrast`
  - Link: `linkDensity`, `linkThickness`, `linkNoise`, `linkFlow`, `linkContrast`
  - Holographic: `holoIntensity`, `holoFresnel`, `holoDensity`, `holoThickness`, `holoSpeed`
  - Voronoi: `voroScale`, `voroSoft`, `voroFlow`, `voroJitter`, `voroEdge`, `voroContrast`
  - Global: `spinSpeed`, `bounce`
- Blend quality (hook `useBlendLeva.ts`): `quality` → `segments`/`sharpness`.
- Nebula: removed. PostFX is controlled via `useVisualLeva`.

## Domain contracts

- Emotion: `{ id, label, valence, arousal, intensity?, colorHex?, meta? }`
- Link: `{ id, source, target, weight, kind }`
- Galaxy: `{ id, name, members[], centroid?, radius?, colorHex? }`

Multi payload compatible with AI/local:

- `MultiEmotionResult`: `{ version: 1, emotions[], global, pairs[] }`
- An emotion can include `id` (stable), `relations` (labels) and `colors` (palette). The mapper creates implicit links from `relations` when destination emotions exist.

## Configuration

- `VITE_EMOTION_MODE`: online | offline | auto
- OpenAI: `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`
- Visuals/audio/textures in `src/config/config.ts` (AUDIO, TEXTURES, intro timings, energy flags).
- See `env_template` for an example. For audio and textures, adjust `src/config/config.ts` (not environment variables).

## Performance and UX

- DOM: animate transform/opacity and declare `will-change`.
- WebGL: cap DPR per device; light postprocessing; reasonable geometry segments; AO requires `uv2` (duplicated at runtime for the PBR sphere).
- Debounce (350–450ms) and cancellation for responsive interaction.

## Run

```powershell
npm run dev     # development with HMR
npm run build   # TypeScript + Vite build
npm run preview # serve the build
```

## Extend/tune

- Add emotion/synonym: update `config/emotion-clusters` and optionally `emotion-presets`.
- Change galaxy layout: extend `ClusterEngine` or add a layout in systems.
- Link rules: add rules in `RuleEngine`.

### Additional R3F visuals

- Energy links between primaries: `computePrimaryEnergyLinks` rendered in `ClustersScene` via `@react-three/drei/Line` with gradient `vertexColors`.
- Pulses traveling along bezier: `EnergyPulse` in `ClustersScene` with `useFrame`.
- Staged intro: timeline in `useFrame` revealing planets → satellites → orbits → links.

### Audio

- `AudioManager` centralizes context and volumes (master/ambient/sfx) and resumes on interaction.
- `config.AUDIO` defines toggles and routes. Hover SFX per emotion.

### PBR textures

- `config.TEXTURES` chooses `PLANET_KEY` and `PACK`. Passed as a prop to `Planet` to enable PBR.
- `planetTextures.ts` loads maps and adjusts color space and sampling. `uv2` ensured on geometry.

## Notes

- Prefer `import.meta.env` with `VITE_*` keys.
- `EmotionServiceFactory` is the only place to change online/offline policy.

### State storage (R3F)

- `useUniverse` (`src/state/universe.store.ts`) keeps `{ emotions, links, galaxies, layout, positions }`.
- `ClustersScene` consumes `useUniverse.emotions` (satellites per cluster) and `useUniverse.links` (pair currents). The planet color tilts toward the cluster's dominant emotion.

### Link visibility in ClustersScene

- Default links between primaries: visible only when `!thinking` and `links.length === 0`.
- Ephemeral currents (pairs/relations): visible when `links.length > 0`; each link creates temporary arcs/“pulses” between different clusters.

### Client-side link re-balance

- When the backend doesn't cross clusters, the client can synthesize 1–2 cross-cluster links between the strongest emotions for legibility.
- Implemented in `EmotionServiceFactory.analyzeToGraph` and `OpenIAAdapter.analyzeToGraph` with cluster/weight checks.
