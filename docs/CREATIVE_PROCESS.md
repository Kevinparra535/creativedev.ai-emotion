# Creative process

This lab evolved through iterative exploration. Highlights:

1. Scene stability and UX
   - Leva controls, camera framing, and animation pipelines.
   - Fixed animation freezes via ref-driven frame updates and keyed remounts.
2. Visual effects expansion
   - Link, Holographic, and Voronoi shader branches for the Blend Planet.
   - Smoothed pop-in/shrink transitions; satellites mirror effect changes.
3. Build unblock and QA
   - Fixed shader compile issues (GLSL function scope, uniform redefinitions).
   - Removed unused imports; lint and builds pass.
4. Architectural consolidation
   - A unified coordinator hook reduces duplicate API calls and re-renders.
   - MainScreen refactored to use the coordinator; docs updated accordingly.

The process prioritizes small, safe steps with frequent visual validation.
