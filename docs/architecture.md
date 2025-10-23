# Arquitectura de creativedev.ai-emotion (v2)

La app convierte texto en visuales reactivos (DOM y WebGL) en función de emociones detectadas en tiempo real. La nueva capa de servicios permite alternar entre modo offline (heurística local) y online (API) con un solo toggle.

## Stack principal

- React 19 + TypeScript + Vite (SWC)
- Render dual: DOM (Framer Motion + styled-components) y WebGL con R3F/Drei
- Estado: Zustand; Controles: Leva
- Lint/Format: ESLint flat config + Prettier

## Flujo de extremo a extremo

1) Usuario escribe en el input (`PromptInput` controlado por `Canvas`).
2) Hay dos caminos en paralelo:
   - UI inmediata: `useEmotionEngine` publica una emoción dominante al store para feedback DOM rápido (gradientes, micro-animaciones).
   - Universo 3D: `emotionService.analyzeToGraph` genera un grafo de emociones (nodos + enlaces + galaxias) y lo publica para R3F.
3) DOM: `Vizualizer` usa `emotion-presets` para colorear y mover según la emoción.
4) WebGL: `UniverseScene` renderiza nodos y enlaces instanciados; galaxias según clusters primarios.

```mermaid
flowchart LR
  A[PromptInput] -- text --> B[useEmotionEngine]
  A -- text --> C[emotionService.analyzeToGraph]
  B -- Emotion --> D[Vizualizer (DOM)]
  C -- {emotions,links,galaxies} --> E[UniverseScene (R3F)]
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

- Rendering R3F instanciado
  - `GalaxyInstanced.tsx`, `LinksInstanced.tsx`, `HaloCloud.tsx` optimizan el render (batch/instancing).
  - `UniverseCanvas.tsx` incluye luces, OrbitControls y Stats.

## Contratos (dominio)

- Emotion: `{ id, label, valence, arousal, intensity?, colorHex?, meta? }`
- Link: `{ id, source, target, weight, kind }`
- Galaxy: `{ id, name, members[], centroid?, radius?, colorHex? }`

Payload (multi) compatible con IA/local:
- `MultiEmotionResult`: `{ version: 1, emotions[], global, pairs[] }`

## Configuración

- `VITE_EMOTION_MODE`: online | offline | auto
- OpenAI: `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`
- Ver `env_template` para ejemplo.

## Performance y UX

- DOM: animar transform/opacity y declarar `will-change`.
- WebGL: instancing para nodos/enlaces; DPR adaptativo en canvas; postprocesado ligero.
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

## Notas

- Preferir `import.meta.env` y claves `VITE_*`.
- `EmotionServiceFactory` es el único lugar a tocar para cambiar política online/offline.
