## Vision (UX + IA)
“Lo que sientes al escribir, lo ves moverse”. El texto se analiza en tiempo real y se traduce a visuales: gradientes, micro-animaciones y una galaxia R3F de emociones (alegría → cálidos/expansión; miedo → fríos/contracción; nostalgia → desaturados/grano).

## Project at a glance
- React 19 + TypeScript. Entrypoint: `src/main.tsx` → `src/App.tsx`.
- Vite + SWC (`@vitejs/plugin-react-swc`) en `vite.config.ts` (alias `@` → `src`).
- Render dual: DOM (Framer Motion + styled-components) y WebGL con R3F/Drei/Postprocessing.
- Estado: Zustand (`src/stores/*`). UI controls: Leva.
- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`.

## Arquitectura y flujos
- Input → engine → visuales:
  - `features/prompt/PromptInput.tsx`: textarea con overlay de “highlights” por palabra clave (usa `getPresetForEmotion`).
  - `hooks/useEmotionEngine.ts`: debounce 350–400ms, cancela peticiones, expone `{ emotion, analyzing, error }`.
  - `services/openIAService.ts`: `analyzeText(text)` usa heurística local (`utils/iaUtiils.localHeuristic`) por defecto; opcional OpenAI vía `VITE_OPENAI_*`. Multi: `analyzeTextMulti(text)`.
  - Resultado a stores (`stores/emotionStore.ts`) y a visuales DOM (`scene/dom/Vizualizer.tsx`) y R3F (`scene/r3f/*`).
- Presets y clusters:
  - `config/emotion-presets.ts`: `getPresetForEmotion(label)` → `{ colors, motion, particles }`.
  - `config/emotion-clusters.ts`: definición de “galaxias” primarias con posición sugerida/valence/arousal.
- Universo de emociones (opcional): `services/universeGraph.ts` → `analyzeTextToGraph(text)` segmenta por frases, intenta multi-emoción y hace fallback con `expandFromDominant` para construir `{ nodes, edges, summary }`.

## Contratos (tipos clave)
- EmotionResponse: `{ label: string; score: number; valence: -1..1; arousal: 0..1; colors: string[]; intensity: 0..1; relations: string[] }`.
- MultiEmotionResult: `{ emotions: {label, weight, valence?, arousal?, colors?, intensity?}[], global?, pairs? }`.
- VisualPreset: `{ colors: string[]; motion: 'expand'|'sway'|'fall'|'tremble'|'pulse'|'recoil'|'neutral'; particles: 'dense-up'|'few-float'|'drops'|'spikes'|'sparks'|'grain'|'none' }`.

## Convenciones del proyecto
- Importa con alias `@/` (Vite). En el entrypoint se permite extensión `.tsx`; en el resto suele omitirse.
- Variables de entorno sólo `VITE_*` (ver `src/config/config.ts`). No uses `process.env` directo.
- Mantén la lógica de IA aislada en `services/openIAService.ts` y helpers en `utils/iaUtiils.ts`.
- R3F: usa `scene/r3f/R3FCanvas.tsx` como root y añade escenas como hijos (p. ej., `ClustersScene` con `layout='arrow'|'affect'|'centers'`).

## Workflows de dev
- `npm run dev` HMR.
- `npm run build` compila TS y genera build Vite.
- `npm run preview` sirve la build.
- `npm run lint` y `npm run lint:fix` para ESLint; `npm run format(:check)` para Prettier.

## Integración y gotchas
- Vite está fijado a `rolldown-vite@7.1.14` (ver `package.json.overrides`). No cambies salvo actualización consciente.
- SWC activo; evita configs de Babel. Respeta `@` alias.
- R3F Canvas ajusta DPR según `prefers-reduced-motion` y `navigator.deviceMemory` (ver `R3FCanvas.tsx`).
- OpenAI: configura `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`; sin clave, el sistema usa heurística local.

## Ejemplos en código
- Engine en UI: `ui/components/Canvas.tsx` usa `useEmotionEngine` y publica en `emotionStore`.
- Visual DOM: `scene/dom/Vizualizer.tsx` aplica gradiente y micro-movimiento según preset; `features/prompt/PromptInput.tsx` pinta highlights con los mismos colores.
- Visual R3F: `scene/r3f/ClustersScene.tsx` renderiza planetas/orbitas por cluster y evita colisiones por relajación.

## Performance (práctico)
- Anima transform/opacity; usa `will-change`. Evita repaints grandes y state por frame.
- R3F en un solo `Canvas`; postprocesado ligero (Bloom/Noise/Vignette). DPR limitado 1.25–2 según dispositivo.

## Archivos clave
- `package.json`, `vite.config.ts`, `src/config/config.ts`
- `src/hooks/useEmotionEngine.ts`, `src/services/openIAService.ts`, `src/utils/iaUtiils.ts`
- `src/config/emotion-presets.ts`, `src/config/emotion-clusters.ts`
- `scene/dom/Vizualizer.tsx`, `scene/r3f/R3FCanvas.tsx`, `scene/r3f/ClustersScene.tsx`

¿Qué sección te gustaría profundizar (flujo del engine, presets, R3F galaxia, o pipeline de universo)? Puedo ampliar con ejemplos o contratos adicionales.
