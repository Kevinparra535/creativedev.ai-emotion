# Proof of Concept (PoC)

Goal: validate the end-to-end path from text → emotions → visuals.

- Local heuristic mode produces stable payloads without an API key.
- The R3F scene renders primary planets, orbits, and energy links from domain data.
- Blend Planet combines colors from active emotions with Watercolor/Oil branches.

Outcomes

- Latency: comfortably under 200ms for local analysis + render updates.
- Visual parity: identical planet/satellite parameters between DOM and R3F where relevant.
- Extensibility: adapter pattern for services; Zod validation for payloads.
