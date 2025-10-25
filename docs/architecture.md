# Arquitectura de creativedev.ai-emotion (v2)

La app convierte texto en visuales reactivos (DOM y WebGL) en función de emociones detectadas en tiempo real. La capa de servicios permite alternar entre modo offline (heurística local) y online (API) con un solo toggle, y unifica el pipeline para DOM y R3F.

## Stack principal

- React 19 + TypeScript + Vite (SWC)
- Render dual: DOM (Framer Motion + styled-components) y WebGL con R3F/Drei/Postprocessing
- Estado: Zustand (UI stores en `src/stores/*`, dominio en `src/state/*`); Controles: Leva
- Lint/Format: ESLint flat config + Prettier

## Flujo de extremo a extremo

1. Usuario escribe en el input (`PromptInput` controlado por `Canvas`).
2. Hay dos caminos en paralelo:

- UI inmediata: `useEmotionEngine` publica una emoción dominante al store para feedback DOM rápido (gradientes, micro-animaciones).

- Universo 3D: `emotionService.analyzeToGraph` genera un grafo de emociones (nodos + enlaces + galaxias) y lo publica para R3F.

1. DOM: `Vizualizer` usa `emotion-presets` para colorear y mover según la emoción.
2. WebGL: `ClustersScene` es la escena principal (planetas/satélites/enlaces); `UniverseScene` queda como alternativa.

```mermaid
flowchart LR
  A[PromptInput] -- text --> B[useEmotionEngine]
  A -- text --> C[emotionService.analyzeToGraph]
  B -- Emotion --> D[Vizualizer (DOM)]
  C -- {emotions,links,galaxies} --> E[ClustersScene/UniverseScene (R3F)]
```

## Modo de análisis (factory)

- Toggle: `VITE_EMOTION_MODE = online | offline | auto` (por defecto: auto)
- Factory: `EmotionServiceFactory` expone `emotionService`:
  - online: usa `OpenIAAdapter` (API + Zod validation + fallback permisivo)
  - offline: usa `local-emotions` (`buildPayloadFromText`/`localHeuristic`)
  - auto: online si hay `VITE_OPENAI_API_KEY`, si no offline

## Módulos clave

- `src/services/EmotionServiceFactory.ts`
  - Contrato común: `analyze`, `analyzeMulti`, `analyzeToGraph`
  - Concatena reglas (`RuleEngine`) y clustering (`ClusterEngine`) para el universo.

- `src/services/OpenIAAdapter.ts`
  - Chat completions → texto → JSON
  - Primero valida con `PayloadZ` (Zod); si falla, parser permisivo (`tryParseMulti`), y último fallback heurístico.
  - `mapAIToDomain` transforma a `Emotion[]`/`Link[]`.

- `src/ai/local-emotions.ts`
  - `localHeuristic(text)` → emoción dominante normalizada
  - `expandFromDominant` y `buildPayloadFromText` → payload multi (emotions + pairs + global)

- `src/services/universeGraph.ts`
  - Crea un grafo por frases: acumula pesos, valence/arousal, co-ocurrencias y pares semánticos.
  - Fallbacks de afecto centralizados vía `AFFECT_DEFAULTS` (ClusterEngine).

- `src/systems/ClusterEngine.ts`
  - Centraliza defaults de afecto (valence, arousal, palette) y sinónimos desde `config/emotion-clusters`.
  - `clusterByPrimaries` genera galaxias reales (love/joy/fear/…)

- `src/systems/GraphBuilder.ts` y `src/systems/RuleEngine.ts`
  - Merge de links, clustering auxiliar y reglas (ej. polaridad, transiciones).

### Rendering R3F (galaxias y primarias)

- `R3FCanvas.tsx`: canvas único con luces, CameraControls, postprocesado (Bloom, Noise, Vignette, Chroma) y DPR adaptativo; controles en `useVisualLeva`.
- `ClustersScene.tsx`: planetas primarios + satélites; órbitas elípticas; enlaces energéticos con degradado y "neuron pulses"; intro animada por etapas.
- Objetos: `objects/Planets.tsx`, `objects/Orbits.tsx`; utilidades en `scene/r3f/utils/*`.
- `UniverseScene.tsx`: alternativa para grafo completo (nodos/enlaces) cuando se visualiza el universo.
- Utils de escena: `makeOrbitPoints`, `makeArcPoints`, `gradientColors`, `relaxMainPositions`, `computePrimaryEnergyLinks`.
- Audio: `AudioManager.ts` (ambient + hover SFX), controles vía Leva.
- Texturas PBR: `objects/Planets.tsx` + `utils/planetTextures.ts` aplican un pack a un planeta configurable con AO/normal/roughness/metalness/opcional displacement.

## Contratos (dominio)

- Emotion: `{ id, label, valence, arousal, intensity?, colorHex?, meta? }`
- Link: `{ id, source, target, weight, kind }`
- Galaxy: `{ id, name, members[], centroid?, radius?, colorHex? }`

Payload (multi) compatible con IA/local:

- `MultiEmotionResult`: `{ version: 1, emotions[], global, pairs[] }`
- Emoción puede incluir `id` (estable), `relations` (array de labels) y `colors` (paleta). El mapper creará links implícitos desde `relations` cuando existan emociones destino.

## Configuración

- `VITE_EMOTION_MODE`: online | offline | auto
- OpenAI: `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`
- Config de visuales/audio/texturas en `src/config/config.ts` (AUDIO, TEXTURES, tiempos de intro, flags de energía).
- Ver `env_template` para ejemplo. Para audio y texturas, ajustar `src/config/config.ts` (no variables de entorno).

## Performance y UX

- DOM: animar transform/opacity y declarar `will-change`.
- WebGL: limitación de DPR según dispositivo; postprocesado ligero; geometrías con segmentos razonables; AO requiere `uv2` (duplicado en run-time para esfera PBR).
- Debounce (350–450ms) y cancelación para interacción fluida.

## Cómo ejecutar

```powershell
npm run dev     # desarrollo con HMR
npm run build   # compila TS + build Vite
npm run preview # sirve la build
```

## Extender/ajustar

- Agregar emoción/sinónimo: actualizar `config/emotion-clusters` y, si hace falta, `emotion-presets`.
- Cambiar layout de galaxias: extender `ClusterEngine` o añadir layout en sistemas.
- Reglas de enlaces: añadir reglas a `RuleEngine`.

### Visuales R3F adicionales

- Enlaces energéticos entre primarias: `computePrimaryEnergyLinks` y render en `ClustersScene` usando `@react-three/drei/Line` con `vertexColors` degradados.
- Pulsos (neuronas) viajando por bezier: `EnergyPulse` en `ClustersScene` con `useFrame` para animación.
- Intro escalonada: timeline en `useFrame` que destapa planetas → satélites → órbitas → enlaces.

### Audio

- `AudioManager` centraliza contexto y volúmenes (master/ambient/sfx) y reanuda tras interacción.
- `config.AUDIO` define toggles y rutas. Hover SFX por clave de emoción.

### Texturas PBR

- `config.TEXTURES` elige `PLANET_KEY` y `PACK`. Se pasa como prop a `Planet` para habilitar PBR.
- `planetTextures.ts` carga mapas y ajusta color space y sampling. `uv2` se asegura en geometría.

## Notas

- Preferir `import.meta.env` y claves `VITE_*`.
- `EmotionServiceFactory` es el único lugar a tocar para cambiar política online/offline.

### Almacenamiento de estado (R3F)

- `useUniverse` (`src/state/universe.store.ts`) mantiene `{ emotions, links, galaxies, layout, positions }`.
- ClustersScene consume `useUniverse.emotions` (satélites por cluster) y `useUniverse.links` (pair currents). El color del planeta toma `colorHex` de la emoción dominante por cluster.

### Visibilidad de enlaces en ClustersScene

- Enlaces por defecto entre primarias: visibles sólo cuando `!thinking` y `links.length === 0`.
- Corrientes efímeras (pairs/relations): visibles cuando `links.length > 0`; cada link genera arcos/“pulsos” temporales entre clusters distintos.
