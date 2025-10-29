## Qué es (resumen)
“Lo que sientes al escribir, lo ves moverse”. Texto → análisis emocional en tiempo real → DOM (gradientes/micro-animaciones) + R3F (planetas, enlaces energéticos, audio, PBR y Planeta Blend con efectos Watercolor/Oil/Link/Holo/Voronoi).

## Arquitectura y flujo (v2)
- Stack: React 19 + TS + Vite 7 (SWC). Entrypoint `src/main.tsx` → `src/App.tsx`; alias `@` → `src`.
- Input `features/prompt/PromptInput.tsx` → `hooks/useEmotionCoordinator` (debounce 350–450ms + cancelación) → sincroniza stores: UI (`src/stores/*`) y dominio `src/state/universe.store.ts`.
- Servicio único: `services/EmotionServiceFactory` expone `emotionService.{analyze, analyzeMulti, analyzeToGraph}`; decide entre `OpenIAAdapter` (online) y `ai/local-emotions` (offline).
- DOM: `scene/dom/Vizualizer.tsx` aplica `config/emotion-presets`.
- WebGL: `scene/r3f/R3FCanvas.tsx` (único canvas) + `scene/r3f/ClustersScene.tsx` (planetas/satélites/órbitas/enlaces + Planeta Blend). `UniverseScene` es alternativa para grafo completo.

## Modos de análisis y contratos
- `VITE_EMOTION_MODE=online|offline|auto` (auto por defecto según `VITE_OPENAI_API_KEY`).
- Payload multi (IA/local): `{ version: 1, emotions[], pairs[], global? }`.
- Emoción: `id?`, `label`, `valence[-1..1]`, `arousal[0..1]`, `intensity|weight`, `colors?`, `relations?`.
- Mapeo: `src/data/mappers.ts` → `{ emotions: Emotion[]; links: Link[] }` (ClustersScene). Zod estricto + parser permisivo en `utils/validators.ts`/`utils/iaUtiils.ts`.

## Núcleo de dominio/sistemas
- Grafo: `services/universeGraph.ts` acumula pesos/co-ocurrencias; `systems/GraphBuilder.ts` y `systems/RuleEngine.ts` normalizan y aplican reglas.
- Clustering: `systems/ClusterEngine.ts` usa `config/emotion-clusters.ts` para galaxias primarias y paletas.
- Estado R3F: `state/universe.store.ts` guarda `{ emotions, links, galaxies, layout, positions }`.

## R3F: patrones clave
- Un solo canvas; objetos en `scene/r3f/objects/*`, utilidades en `scene/r3f/utils/*`.
- Planeta Blend en `objects/Planets.tsx`; controles: `hooks/useEmotionVisuals2.ts` (efecto), `hooks/useBlendLeva.ts` (calidad), PostFX sólo vía `hooks/useVisualLeva.ts` (Nebula retirada).
- Visibilidad de enlaces (ClustersScene): por defecto ocultos durante `thinking` o si `links.length > 0`; mostrar corrientes efímeras cuando `links.length > 0`.

## Workflows de dev
- Ejecutar: `npm run dev` (HMR), `npm run build` (TS + Vite), `npm run preview`.
- Lint/format: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`.
- Debug: Leva (`useVisualLeva`, `useEmotionVisuals2`, `useBlendLeva`, `useAudioLeva`) + `utils/logger.ts`.

## Convenciones y gotchas
- Usa `import.meta.env.VITE_*` (no `process.env`). Ver `env_template` y `src/config/config.ts` (AUDIO/TEXTURES/intro/flags).
- Vite fijado a `rolldown-vite@7.1.14` (overrides) + plugin React SWC; no añadir Babel.
- OpenAI (opcional): `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL?`, `VITE_OPENAI_MODEL?`; sin clave → heurística local.
- PBR: AO requiere `uv2` (duplicado en runtime). Texturas y audio se ajustan en `src/config/config.ts`.
- Re-balance de enlaces cliente: se sintetizan 1–2 cross-cluster si falta cruce (ver `EmotionServiceFactory.analyzeToGraph`/`OpenIAAdapter.analyzeToGraph`).

## Referencias rápidas
- Config: `package.json`, `vite.config.ts`, `src/config/config.ts`.
- IA: `services/EmotionServiceFactory.ts`, `services/OpenIAAdapter.ts`, `ai/local-emotions.ts`, `data/mappers.ts`.
- R3F/DOM: `scene/dom/Vizualizer.tsx`, `scene/r3f/R3FCanvas.tsx`, `scene/r3f/ClustersScene.tsx`.
- UI: `ui/components/MainScreen.tsx` integra el pipeline y publica en stores.
