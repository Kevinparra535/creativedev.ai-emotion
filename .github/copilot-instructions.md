## Vision (UX + IA)
“Lo que sientes al escribir, lo ves moverse”. La app analiza el tono/emoción del texto y transforma visuales en tiempo real: fondos/gradientes, partículas y micro-animaciones (p. ej., alegría → cálidos/expansión; miedo → fríos/contracción; nostalgia → desaturados/grano).

## Project at-a-glance
- React 19 + TypeScript. Entrypoint: `src/main.tsx` → `src/App.tsx`.
- Vite + SWC (`@vitejs/plugin-react-swc`) configured in `vite.config.ts`.
- Scripts: `dev` (vite), `build` (`tsc -b && vite build`), `preview`, `lint`.

## Architecture (propuesta concreta para agentes)
- Flujo: `TextInput` → `EmotionEngine` (análisis) → `VisualMapper` (mapa emoción→preset) → escena (`BackgroundGradient`, `Particles`, `MicroAnimations`).
- Contrato de resultado mínimo:
	- `EmotionResult = { label: 'joy'|'fear'|'nostalgia'|string; score: number; valence: -1..1; arousal: 0..1 }`.
- Ubicaciones sugeridas:
	- `src/services/emotion.ts` exporta `analyzeText(text): Promise<EmotionResult>` (heurística local por defecto; fácil de cambiar a API/LLM).
	- `src/config/emotion-presets.ts` mapea `label/valence/arousal → { colors, motionPreset, grain, saturation }`.
	- `src/hooks/useEmotionEngine.ts` orquesta debounced input (150–300ms), invoca análisis y expone estado transicionable.

## Conventions & structure
- Crear carpetas cuando se implementen: `src/components/`, `src/hooks/`, `src/services/`, `src/config/`.
- Estilos actuales en CSS global (`App.css`, `index.css`). Mantén consistencia; añade utilidades locales por componente si es necesario.
- Animaciones: preferir Framer Motion (springs/transitions); shaders/partículas opcional (Canvas/WebGL/Three) detrás de una prop de activación.

## Dev workflows (comandos exactos)
- HMR: `npm run dev`
- Build prod: `npm run build` (TypeScript debe pasar; usa `tsconfig.app.json`/`tsconfig.node.json`).
- Lint: `npm run lint`

## Integration notes / gotchas
- No cambies el alias de `vite` en `package.json` (usa `npm:rolldown-vite@7.1.14`) salvo actualización consciente.
- SWC está activo; evita snippets de configuración específicos de Babel.
- Mantén import locales con extensión `.tsx` como en `src/main.tsx` (`import App from './App.tsx'`).
- Assets: `src/assets/*` y `/vite.svg` desde `public`.

## Ejemplos concretos
- Añade `src/components/BackgroundGradient.tsx` y úsalo en `src/App.tsx` (lee preset desde `useEmotionEngine`).
- Implementa `src/services/emotion.ts` con heurística simple ahora y deja lista la interfaz para API posterior.
- Transiciones: usa `motion.div` con `layout` y `spring` para cambios de preset sin saltos.

## Rendimiento: 60fps en equipos modestos
- Anima solo `transform` y `opacity` (evita `width/height/top/left`). Declara `will-change: transform, opacity` y desactiva interacción en capas animadas (`pointer-events: none`).
- Minimiza efectos costosos: reduce `box-shadow`/`backdrop-filter`; precomputa gradientes y evita repaints sobre grandes áreas.
- Framer Motion:
	- Evita re-render por frame (usa `motion` + `useAnimationControls`/`MotionValue`; no muevas estado React en cada frame).
	- Prefiere `spring` cortos y compuestos de `transform` (rotate/scale/translate) sobre `layout` cuando no sea necesario.
	- Pausa fuera de viewport (`whileInView`, `useInView`) y respeta `useReducedMotion()`.
- Partículas:
	- Canvas/WebGL en un solo layer; nunca DOM por partícula.
	- Cap dinámico de partículas y resolución según el dispositivo:
		- `const lowEnd = matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.deviceMemory ?? 8) <= 4`
		- `const dpr = lowEnd ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 2)`
	- Usa `requestAnimationFrame` con delta time; evita `setInterval`.
	- Batch draw; no recalcules estilos por partícula.
- React 19:
	- Aísla animaciones en componentes memoizados (`React.memo`) y usa refs para datos mutables.
	- Evita props que cambian cada frame; usa objetos/funciones memoizadas.
- Medición rápida: Chrome Performance (FPS y “Timings”), React Profiler para renders, y el “Layers” panel para confirmar composición (transform/opacity).

## Archivos clave
- `package.json`, `vite.config.ts`
- `src/main.tsx`, `src/App.tsx`
- `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`

¿Falta algo para implementar el motor de emoción o los visuales? Dime y lo añado (contratos, ejemplos, o estructura inicial de carpetas/archivos).
