!["Emotion Universe cover"](docs/readme_cover.png)

# CreativeDev: Emotion Universe · [Live demo](https://labs-ai-emotion.web.app/)

![R3F](https://img.shields.io/badge/R3F-React%20Three%20Fiber-black)
![WebGL2](https://img.shields.io/badge/WebGL2-FBO-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

Text you write becomes motion you see. The app turns text into real‑time emotional visuals: a DOM visualizer (gradients + micro‑animations) now, and a 3D emotional galaxy (R3F) with planets, orbits, links, audio, and a Blend Planet planned next.

This README covers essentials; detailed docs live in [docs/](docs/README.md).

## Features

- Real‑time emotion analysis with debounce and cancellation (smooth UX)
- Local heuristic by default; optional OpenAI integration ready
- Prompt highlighting: keywords get animated gradient spans (safe overlay)
- Visual presets per emotion: colors + motion style + grain
- Leva control panel with live sliders (intensity, speed, grain) and Save/Share actions
- Clean build/tooling: Vite 7 (SWC), ESLint flat config, Prettier; `@` alias → `src`

## How it works

- Flow: `PromptInput` → `useEmotionEngine` → `openIAService.analyzeText` → `emotion-presets` → `Vizualizer`
- Key files:
	- `src/features/prompt/PromptInput.tsx`: text area + highlight overlay
	- `src/hooks/useEmotionEngine.ts`: debounce + AbortController, exposes `{ emotion, analyzing }`
	- `src/services/openIAService.ts`: local heuristic + OpenAI‑ready parser
	- `src/config/emotion-presets.ts`: `label → { colors, motion, particles }`
	- `src/scene/dom/Vizualizer.tsx`: gradient background + motion per preset + grain overlay
	- `src/ui/components/Canvas.tsx`: intro animation, loader “Reading your tone…”, Leva

## Tech stack

- React 19 + TypeScript + Vite 7 (SWC)
- styled‑components, Framer Motion
- Optional: Three.js with React Three Fiber (@react-three/fiber, @react-three/drei), lightweight PostFX
- State: Zustand; Controls: Leva

## Quick start

- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Configuration

- Use `import.meta.env` with `VITE_*` keys (don’t expose `process.env`):
	- `VITE_OPENAI_API_KEY` (optional)
	- `VITE_OPENAI_BASE_URL` (optional; default `https://api.openai.com/v1`)
	- `VITE_OPENAI_MODEL` (optional; default `gpt-4o-mini`)
- See `src/config/config.ts` and `env_template`.
- Vite is pinned to `rolldown-vite@7.1.14` in `package.json`.

## Project structure (key paths)

```
src/
	features/prompt/PromptInput.tsx   # highlight overlay + textarea
	hooks/useEmotionEngine.ts         # debounce + cancel + state
	services/openIAService.ts         # local heuristic + parser
	config/emotion-presets.ts         # emotion → visual preset
	scene/dom/Vizualizer.tsx          # DOM visualizer (gradients + motion)
	ui/components/Canvas.tsx          # orchestration + Leva + loader
```

## Roadmap

- Implemented (DOM‑first): prompt overlay, emotion engine, presets, Leva controls
- Next (R3F): single canvas, ClustersScene (planets/satellites/links), Blend Planet, PostFX
- Future: audio‑reactive visuals (WebAudio), multi‑emotion blending, snapshots/sharing, WebGPU exploration

## Documentation

- Docs index: [docs/README.md](docs/README.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Data contracts: [docs/data-contracts.md](docs/data-contracts.md)

## License & credits

MIT License. Audio, textures, and shader techniques draw inspiration from the R3F community and Three.js examples.
