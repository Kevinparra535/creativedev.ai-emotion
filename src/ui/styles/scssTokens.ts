import { css } from 'styled-components';

// Spacing tokens (parity with SCSS)
export const spacing = {
  space: 'var(--space)',
  space_half: 'var(--space-half)',
  space_x2: 'var(--space-x2)',
  space_x3: 'var(--space-x3)',
  space_x4: 'var(--space-x4)',
  space_x5: 'var(--space-x5)',
  space_x6: 'var(--space-x6)',
  space_x7: 'var(--space-x7)'
};

// Color tokens (parity with SCSS)
export const colors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  variant: 'var(--color-variant)',
  variant_two: 'var(--color-variant-two)',
  variant_three: 'var(--color-variant-three)',
  variant_four: 'var(--color-variant-four)',
  variant_five: 'var(--color-variant-five)',
  variant_six: 'var(--color-variant-six)',

  mood_two_primary: 'var(--color-mood-two-primary)',
  mood_two_secondary: 'var(--color-mood-two-secondary)',
  mood_two_dark: 'var(--color-mood-two-dark)',
  mood_two_light: 'var(--color-mood-two-light)',

  mood_three_primary: 'var(--color-mood-three-primary)',
  mood_three_secondary: 'var(--color-mood-three-secondary)',
  mood_three_dark: 'var(--color-mood-three-dark)',
  mood_three_light: 'var(--color-mood-three-light)',

  mood_four_primary: 'var(--color-mood-four-primary)',
  mood_four_secondary: 'var(--color-mood-four-secondary)',
  mood_four_dark: 'var(--color-mood-four-dark)',
  mood_four_light: 'var(--color-mood-four-light)',

  mood_five_primary: 'var(--color-mood-five-primary)',
  mood_five_secondary: 'var(--color-mood-five-secondary)',
  mood_five_dark: 'var(--color-mood-five-dark)',
  mood_five_light: 'var(--color-mood-five-light)',

  negative: 'var(--color-negative)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  check: 'var(--color-check)',

  bg_light: 'var(--color-bg-light)',
  bg_dark: 'var(--color-bg-dark)',
  light: 'var(--color-light)',
  dark: 'var(--color-dark)'
};

// Typography tokens
export const fonts = {
  heading: 'var(--font-heading)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Courier New", monospace)'
};

export const weights = {
  light: 400,
  normal: 500,
  medium: 600,
  bolder: 700,
  black: 800
};

// Mixins equivalents to SCSS
export const fontSize = (px: number) => {
  const rem = px / 16;
  return css`
    font-size: ${rem}rem;
    line-height: ${rem * 1.5}rem;
  `;
};

export const getOpacity = (colorCss: string, amount: number) => `color-mix(in srgb, ${colorCss} ${
  Math.max(0, Math.min(1, amount)) * 100
}%, transparent)`;

// Size mixin (SCSS parity): size(width[, height])
const toCssSize = (v: string | number | undefined) => (typeof v === 'number' ? `${v}px` : v);

export const size = (width: string | number, height?: string | number) => css`
  width: ${toCssSize(width)};
  height: ${toCssSize(height ?? width)};
`;

// Text style mixins (SCSS parity): transform/decoration/weight shortcuts
export const fontWeight = (key: keyof typeof weights | number) =>
  typeof key === 'number' ? key : weights[key];

export const textStyle = (opts: {
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  decoration?: 'none' | 'underline' | 'line-through' | 'overline';
  weight?: keyof typeof weights | number;
}) => css`
  ${opts.transform ? `text-transform: ${opts.transform};` : ''}
  ${opts.decoration ? `text-decoration: ${opts.decoration};` : ''}
  ${opts.weight != null ? `font-weight: ${fontWeight(opts.weight)};` : ''}
`;

// Color parsing helpers and contrast utilities
type RGB = { r: number; g: number; b: number };

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const hexToRgb = (hex: string): RGB | null => {
  const h = hex.replace(/^#/, '').toLowerCase();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const rgbStringToRgb = (rgb: string): RGB | null => {
  const m = rgb.replace(/\s+/g, '').match(/^rgba?\(([^)]+)\)$/i);
  if (!m) return null;
  const parts = m[1].split(',');
  if (parts.length < 3) return null;
  const parsePart = (p: string) => {
    if (p.endsWith('%')) {
      const v = parseFloat(p);
      if (Number.isNaN(v)) return null;
      return clamp255((v / 100) * 255);
    }
    const v = parseFloat(p);
    if (Number.isNaN(v)) return null;
    return clamp255(v);
  };
  const r = parsePart(parts[0]!);
  const g = parsePart(parts[1]!);
  const b = parsePart(parts[2]!);
  if (r == null || g == null || b == null) return null;
  return { r, g, b };
};

const hslStringToRgb = (hsl: string): RGB | null => {
  const m = hsl.replace(/\s+/g, '').match(/^hsla?\(([^)]+)\)$/i);
  if (!m) return null;
  const parts = m[1].split(',');
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]!);
  const s = parts[1]!.endsWith('%') ? parseFloat(parts[1]!) / 100 : parseFloat(parts[1]!);
  const l = parts[2]!.endsWith('%') ? parseFloat(parts[2]!) / 100 : parseFloat(parts[2]!);
  if ([h, s, l].some((v) => Number.isNaN(v))) return null;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hh >= 0 && hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh >= 1 && hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh >= 2 && hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh >= 3 && hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh >= 4 && hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m0 = l - c / 2;
  return { r: clamp255((r1 + m0) * 255), g: clamp255((g1 + m0) * 255), b: clamp255((b1 + m0) * 255) };
};

const toRgb = (color: string): RGB | null => {
  if (!color) return null;
  const c = color.trim();
  if (c.startsWith('#')) return hexToRgb(c);
  if (/^rgba?\(/i.test(c)) return rgbStringToRgb(c);
  if (/^hsla?\(/i.test(c)) return hslStringToRgb(c);
  return null;
};

// WCAG relative luminance (sRGB)
const relativeLuminance = ({ r, g, b }: RGB): number => {
  const srgb = [r, g, b].map((v) => v / 255);
  const lin = srgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
};

export const getContrastColor = (
  background: string,
  options?: { light?: string; dark?: string; strategy?: 'wcag' | 'yiq'; wcagThreshold?: number }
): string => {
  const light = options?.light ?? '#ffffff';
  const dark = options?.dark ?? '#000000';
  const strategy = options?.strategy ?? 'wcag';
  const rgb = toRgb(background);
  if (rgb) {
    if (strategy === 'wcag') {
      const L = relativeLuminance(rgb);
      const threshold = options?.wcagThreshold ?? 0.179;
      return L > threshold ? dark : light;
    } else {
      const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      return yiq >= 128 ? dark : light;
    }
  }
  return dark;
};

// styled-components mixin to apply text color with contrast against a background
export const contrastText = (background: string, light = '#ffffff', dark = '#000000') => css`
  color: ${getContrastColor(background, { light, dark })};
`;

// SCSS breakpoints equivalents
export const scssBreakpoints = {
  tablet: '768px',
  'desktop-s': '992px',
  'desktop-m': '1200px',
  'desktop-ml': '1366px',
  'desktop-l': '1480px',
  'desktop-xl': '1780px'
} as const;

export const scssMedia = {
  tablet: `@media only screen and (min-width: ${scssBreakpoints.tablet})`,
  'desktop-s': `@media only screen and (min-width: ${scssBreakpoints['desktop-s']})`,
  'desktop-m': `@media only screen and (min-width: ${scssBreakpoints['desktop-m']})`,
  'desktop-ml': `@media only screen and (min-width: ${scssBreakpoints['desktop-ml']})`,
  'desktop-l': `@media only screen and (min-width: ${scssBreakpoints['desktop-l']})`,
  'desktop-xl': `@media only screen and (min-width: ${scssBreakpoints['desktop-xl']})`,
  'mobile-only': `@media only screen and (max-width: ${scssBreakpoints.tablet})`,
  'tablet-p-only': `@media only screen and (min-width: 768px) and (max-width: 992px) and (orientation: portrait)`,
  'tablet-l-only': `@media only screen and (min-width: 768px) and (max-width: 992px) and (orientation: landscape)`,
  'desktop-s-only': `@media only screen and (min-width: 768px) and (max-width: 1200px)`,
  'desktop-m-only': `@media only screen and (min-width: 1200px) and (max-width: 1480px)`
} as const;

export default {
  spacing,
  colors,
  fonts,
  weights,
  fontSize,
  getOpacity,
  size,
  fontWeight,
  textStyle,
  getContrastColor,
  contrastText,
  scssBreakpoints,
  scssMedia
};
