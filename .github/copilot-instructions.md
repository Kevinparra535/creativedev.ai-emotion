## Qué es (resumen)
“Lo que sientes al escribir, lo ves moverse”. El texto se analiza en tiempo real y se traduce a visuales: gradientes/micro-animaciones en DOM y una galaxia R3F con planetas, enlaces “energéticos”, audio y un planeta con texturas PBR.

## Arquitectura y flujo
- React 19 + TS + Vite (SWC). Entrypoint: `src/main.tsx` → `src/App.tsx`; alias `@` → `src`.
- Input (`features/prompt/PromptInput.tsx`) → `useEmotionEngine` (debounce 350–450ms, cancelación) → stores (UI: `src/stores/*`, dominio: `src/state/universe.store.ts`).
- Servicios IA: `EmotionServiceFactory` expone `emotionService.{analyze, analyzeMulti, analyzeToGraph}`; online (`OpenIAAdapter`) u offline (`ai/local-emotions`) según `VITE_EMOTION_MODE`/clave.
- DOM: `scene/dom/Vizualizer.tsx` usa `emotion-presets` (colores/motion/particles).
- R3F: `scene/r3f/R3FCanvas.tsx` único canvas; escena principal `scene/r3f/ClustersScene.tsx` (planetas/satélites/órbitas/enlaces); `UniverseScene` como alternativa de grafo completo.

## Modo de análisis y contratos
- Modo: `VITE_EMOTION_MODE=online|offline|auto` (auto por defecto).
- Payload multi esperado: `{ version: 1, emotions[], pairs[], global? }`.
- Cada emoción: `id?`, `label`, `valence[-1..1]`, `arousal[0..1]`, `intensity/weight`, `colors?`, `relations?`.
- Mapeo a dominio en `src/data/mappers.ts` → `{ emotions: Emotion[]; links: Link[] }` consumidos por `ClustersScene`.

## Convenciones del proyecto
- Importa con `@/…`; evita `process.env`: usa `import.meta.env.VITE_*` (ver `src/config/config.ts` y `env_template`).
- Lógica de IA centralizada en `services/EmotionServiceFactory.ts`/`services/OpenIAAdapter.ts` y helpers `utils/iaUtiils.ts`, `ai/local-emotions.ts`.
- R3F: un solo `R3FCanvas`; añade escenas como hijos. Objetos en `scene/r3f/objects/*`; utils en `scene/r3f/utils/*`.
- Reglas de visibilidad en `ClustersScene`: energía por defecto oculta durante `thinking` o si hay `links`; mostrar corrientes cuando `links.length > 0`.

## Workflows de dev
- `npm run dev` HMR; `npm run build` (TS + Vite); `npm run preview` (serve build).
- Lint/format: `npm run lint`, `npm run lint:fix`, `npm run format(:check)`.
- Debug visual: usa Leva (`useVisualLeva`, `useAudioLeva`) y `src/utils/logger.ts` para trazas.

## Integraciones y gotchas
- Vite está fijado a `rolldown-vite@7.1.14` (overrides). Mantener salvo actualización consciente.
- SWC activo: no añadir Babel. Respeta alias `@`.
- OpenAI (opcional): `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`. Sin clave → heurística local.
- Audio/texturas PBR se configuran en `src/config/config.ts` (`AUDIO`, `TEXTURES`). AO requiere `uv2` (ya duplicado en esfera PBR).

## Archivos de referencia
- `package.json`, `vite.config.ts` (alias/host), `src/config/config.ts`.
- `src/hooks/useEmotionEngine.ts`, `src/services/EmotionServiceFactory.ts`, `src/services/OpenIAAdapter.ts`, `src/ai/local-emotions.ts`.
- `src/config/emotion-presets.ts`, `src/config/emotion-clusters.ts`.
- `scene/dom/Vizualizer.tsx`, `scene/r3f/R3FCanvas.tsx`, `scene/r3f/ClustersScene.tsx`, `scene/r3f/objects/*`.

Ejemplos: `ui/components/MainScreen.tsx` integra el engine y publica en stores; `ClustersScene` rinde planetas/enlaces con intro animada y corrientes efímeras según `links`.
