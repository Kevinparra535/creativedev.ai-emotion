# creativedev.ai-emotion

“Lo que sientes al escribir, lo ves moverse”. El texto se analiza en tiempo real y se traduce a visuales: gradientes y micro-animaciones en DOM, y una galaxia R3F de emociones con enlaces “energéticos”, intro animada, audio interactivo y un planeta con texturas PBR.

## Project at a glance

- React 19 + TypeScript + Vite (SWC). Entrypoint: `src/main.tsx` → `src/App.tsx`.
- Alias `@` → `src` (ver `vite.config.ts`).
- Render dual: DOM (Framer Motion + styled-components) y WebGL (R3F/Drei/Postprocessing).
- Estado: Zustand (`src/stores/*`). Controles: Leva.
- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`.

## Quickstart

Requisitos: Node 18+.

```powershell
npm i
npm run dev     # HMR
npm run build   # TS + Vite build
npm run preview # servir la build
npm run lint    # ESLint + reglas tipo-aware
```

Variables de entorno (opcional): copia `env_template` a `.env` o `.env.local` y ajusta:

```dotenv
VITE_EMOTION_MODE=auto       # online | offline | auto
VITE_OPENAI_API_KEY=         # sólo si usas modo online/auto
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o-mini
```

Sin clave, el motor usa heurística local. Con clave, puedes forzar `VITE_EMOTION_MODE=online`.

## Características

- Engine de emociones con factory: `online`, `offline` y `auto` (Zod schemas + mapeos robustos).
- Visual DOM: gradientes y micro-movimiento sincronizados con el preset de la emoción.
- Galaxia R3F:
  - Planetas principales (primarias) con satélites en órbitas elípticas.
  - Enlaces “energéticos” entre primarias (curvas bezier con degradado y “neuron pulses”).
  - Intro animada por etapas (planetas → satélites → órbitas → enlaces).
  - Audio: soundtrack ambiental + SFX en hover por planeta. Leva para ajustar volúmenes.
  - Texturas PBR para un solo planeta configurable (albedo/normal/roughness/AO/metalness/height).

## Configuración clave

Editar `src/config/config.ts`:

- `EMOTION_MODE`: `online | offline | auto`.
- `AUDIO`: toggles y volúmenes; rutas en `public/audio`.
- `TEXTURES`: `ENABLED`, `PLANET_KEY`, `PACK`, `ENABLE_DISPLACEMENT`, `DISPLACEMENT_SCALE`.

Texturas de ejemplo: `public/textures/planets/ravine-rock1-bl/*`.

Nota: El AO requiere `uv2`. El proyecto ya duplica `uv → uv2` en la geometría de la esfera.

## Estructura relevante

- `src/config/emotion-presets.ts`, `src/config/emotion-clusters.ts`.
- `src/services/openIAService.ts`, `src/services/universeGraph.ts`.
- `src/hooks/useEmotionEngine.ts`, `src/stores/*`.
- `src/scene/r3f/R3FCanvas.tsx`, `src/scene/r3f/ClustersScene.tsx`.
- `src/scene/r3f/objects/Planets.tsx`, `src/scene/r3f/components/*`, `src/scene/r3f/utils/*`.
- `src/scene/dom/Vizualizer.tsx`, `src/ui/components/*`.

## Cómo usar

1) Ejecuta `npm run dev` y escribe en el input. Verás feedback DOM inmediato y la galaxia R3F.
2) Activa audio/ajusta volúmenes desde Leva (si está habilitado en `config.ts`).
3) Para texturas PBR, activa `TEXTURES.ENABLED = true` y define `PLANET_KEY` (ej. `'joy'`).

## Troubleshooting

- “No veo texturas PBR”: verifica `TEXTURES.ENABLED = true` y que el `PLANET_KEY` coincida con una clave de `emotion-clusters`. Revisa que el pack exista en `public/textures/planets/<pack>`.
- “El AO oscurece todo”: la esfera ya copia `uv`→`uv2`. Asegúrate que el pack tenga `*_ao.png` válido; puedes reducir `aoMapIntensity` si lo deseas.
- “No suena el audio”: los navegadores bloquean auto-play. Interactúa una vez (click/tecla) para reanudar; el proyecto intenta `resume` automáticamente.

## Documentación

- Arquitectura: `docs/architecture.md` (flujos, contratos, módulos y cómo extender).

---

Hecho con React, R3F y cariño.
