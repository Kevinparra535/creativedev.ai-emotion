# Style guide

This project uses TypeScript, React 19, styled-components, R3F, and Leva.

## Code

- Use ES modules and named exports where possible; avoid default exports except for React components.
- Keep public APIs stable; prefer local helpers and narrow types.
- No `any`: use domain types or Zod-inferred types; narrow unknowns.

## React

- Prefer function components with hooks.
- Keep effects precise; add only required deps.
- Use refs for frame-loop state (R3F). Avoid storing frame counters in component state.

## Styling

- styled-components for UI. Keep base tokens in `ui/styles/scssTokens.ts` and `ui/styles/theme.ts`.
- Fonts are declared globally in `ui/styles/fonts.ts`.
- Prefer semantic styled components and short, composable styles.

## R3F

- Single Canvas; objects under `scene/r3f/objects/*`; utilities under `scene/r3f/utils/*`.
- Avoid re-creating materials each frame; update uniforms via refs.
- Use keys to remount shaders when effect branches change.

## State

- Zustand stores: `stores/*` for UI concerns, `state/*` for domain (universe).
- Derive data via selectors; avoid passing large objects through props where a store slice works.
