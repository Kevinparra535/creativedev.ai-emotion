# Styling system and tokens

The UI uses styled-components with a simple token system.

## Tokens

- `ui/styles/scssTokens.ts` holds spacing, breakpoints, and media helpers.
- `ui/styles/theme.ts` declares colors and base theme values.
- `ui/styles/base.ts` and `ui/styles/fonts.ts` set base styles and load fonts.

## Fonts

- Poppins (body) and Montserrat (headings).
- Drei/Text in R3F uses the same font files via `scene/r3f/utils/fonts.ts`.

## Patterns

- Keep layout styles co-located with components in `ui/components/*`.
- Prefer composition over deep nested selectors.
- Keep animations simple (opacity/transform) for smoothness.
