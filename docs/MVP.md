# Minimum Viable Product (MVP)

Scope

- Text input → single analysis call (debounced) → DOM + R3F visuals
- Blend Planet with effect presets (Watercolor, Oil, Link, Holographic, Voronoi)
- Primary planets, satellites, energy links, intro sequence
- Leva controls for Blend and PostFX; audio toggles

Non-goals

- Full universe graph interactions (handled separately by UniverseScene)
- Complex post-processing stacks beyond Bloom/Noise/Vignette/Chroma

Success criteria

- Smooth 60FPS at 1080p on mid-tier devices (DPR capped)
- One analysis per input change (no duplicate calls)
- Stable animations without freezes or visual pops
