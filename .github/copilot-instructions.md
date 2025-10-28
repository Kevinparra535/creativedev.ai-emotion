## Qué es (resumen)
“Lo que sientes al escribir, lo ves moverse”. Texto → análisis emocional en tiempo real → visuales sincronizados: DOM (gradientes/micro-animaciones) y R3F (galaxias, enlaces “energéticos”, audio, PBR y Planeta Blend con efectos Watercolor | Oil).

## Arquitectura y flujo
- React 19 + TS + Vite (SWC). Entrypoint: `src/main.tsx` → `src/App.tsx`; alias `@` → `src`.
- Input (`features/prompt/PromptInput.tsx`) → `useEmotionEngine` (debounce 350–450ms, cancelación) → stores (UI: `src/stores/*`, dominio: `src/state/universe.store.ts`).
- Servicios IA vía factory: `EmotionServiceFactory` → `emotionService.{analyze, analyzeMulti, analyzeToGraph}` con `OpenIAAdapter` (online) o `ai/local-emotions` (offline) según `VITE_EMOTION_MODE`/API key.
- DOM: `scene/dom/Vizualizer.tsx` aplica `config/emotion-presets`.
- R3F: `scene/r3f/R3FCanvas.tsx` (único canvas); escena principal `scene/r3f/ClustersScene.tsx` (planetas/satélites/órbitas/enlaces + Planeta Blend). `UniverseScene` es alternativa de grafo completo.

## Modo de análisis y contratos
- Modo: `VITE_EMOTION_MODE=online|offline|auto` (auto por defecto).
- Payload multi (IA/local): `{ version: 1, emotions[], pairs[], global? }`.
- Emoción: `id?`, `label`, `valence[-1..1]`, `arousal[0..1]`, `intensity|weight`, `colors?`, `relations?`.
- Mapeo: `src/data/mappers.ts` → `{ emotions: Emotion[]; links: Link[] }` para `ClustersScene`. Validación estricta Zod + parser permisivo (online) en `utils/validators.ts`/`utils/iaUtiils.ts`.

## Convenciones y patrones
- Importa con `@/...`; no uses `process.env`: usa `import.meta.env.VITE_*` (ver `env_template` y `src/config/config.ts`).
- IA sólo desde `services/EmotionServiceFactory.ts`/`services/OpenIAAdapter.ts`; heurística en `ai/local-emotions.ts`.
- R3F: un solo `R3FCanvas`; objetos en `scene/r3f/objects/*`, utilidades en `scene/r3f/utils/*`.
- Reglas de visibilidad (`ClustersScene`): enlaces por defecto ocultos durante `thinking` o si hay `links`; mostrar corrientes cuando `links.length > 0`.
- Planeta Blend en `objects/Planets.tsx`; controles en `hooks/useEmotionVisuals2.ts` y calidad en `hooks/useBlendLeva.ts`. PostFX sólo desde `hooks/useVisualLeva.ts` (Nebula retirada).

## Workflows de dev
- Ejecutar: `npm run dev` (HMR, `vite --host`), `npm run build` (TS + Vite), `npm run preview`.
- Lint/format: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`.
- Debug visual: Leva (`useVisualLeva`, `useEmotionVisuals2`, `useBlendLeva`, `useAudioLeva`) y trazas con `src/utils/logger.ts`.

## Integraciones y gotchas
- Vite fijado a `rolldown-vite@7.1.14` (overrides). Mantener salvo actualización consciente.
- SWC activo: no añadas Babel. Respeta alias `@`.
- OpenAI (opcional): `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`. Sin clave → heurística local (auto).
- Audio/texturas PBR: configúralas en `src/config/config.ts` (`AUDIO`, `TEXTURES`). AO requiere `uv2` (ya duplicado en la esfera PBR).
- Re-balance de enlaces: si el backend no cruza clusters, el cliente sintetiza 1–2 links (ver `EmotionServiceFactory.analyzeToGraph`/`OpenIAAdapter.analyzeToGraph`).

## Archivos de referencia
- Config: `package.json`, `vite.config.ts`, `src/config/config.ts`.
- IA: `src/services/EmotionServiceFactory.ts`, `src/services/OpenIAAdapter.ts`, `src/ai/local-emotions.ts`, `src/data/mappers.ts`.
- R3F/DOM: `scene/dom/Vizualizer.tsx`, `scene/r3f/R3FCanvas.tsx`, `scene/r3f/ClustersScene.tsx`, `scene/r3f/objects/*`, `scene/r3f/utils/*`.
- UI integración: `ui/components/MainScreen.tsx`.

Ejemplos clave: `MainScreen.tsx` integra el engine y publica en stores; `ClustersScene` rinde planetas/enlaces con intro animada y corrientes efímeras; el Planeta Blend se sitúa en el centroide de clusters activos.
