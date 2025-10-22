import { css } from 'styled-components';

// =====================================
// Theme System para Experiencias 3D
// =====================================

export const themes = {
  light: {
    '--primary-bg': 'var(--color-bg-light)',
    '--secondary-bg': '#ffffff',
    '--accent-color': 'var(--color-info)',
    '--canvas-bg': 'linear-gradient(180deg, #ffffff 0%, #f5f6f8 100%)',
    '--particle-glow': 'rgba(66, 133, 244, 1.0)',
    '--particle-trail': 'rgba(66, 133, 244, 0.25)',

    // Text colors for light mode
    '--text-primary': 'var(--color-dark)',
    '--text-secondary': '#4b5563'
  },
  space: {
    '--primary-bg': '#000012',
    '--secondary-bg': '#1a1a2e',
    '--accent-color': '#6366f1',
    '--canvas-bg': 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
    '--particle-glow': '#00ffff',
    '--particle-trail': 'rgba(0, 255, 255, 0.3)'
  },

  neon: {
    '--primary-bg': '#0d0d0d',
    '--secondary-bg': '#1a0d1a',
    '--accent-color': '#ff0080',
    '--canvas-bg': 'radial-gradient(circle at center, #2d1b35 0%, #0d0d0d 100%)',
    '--particle-glow': '#ff0080',
    '--particle-trail': 'rgba(255, 0, 128, 0.4)'
  },

  ocean: {
    '--primary-bg': '#001122',
    '--secondary-bg': '#003344',
    '--accent-color': '#00aacc',
    '--canvas-bg': 'radial-gradient(ellipse at bottom, #003366 0%, #001122 100%)',
    '--particle-glow': '#00ffaa',
    '--particle-trail': 'rgba(0, 255, 170, 0.3)'
  },

  forest: {
    '--primary-bg': '#0f1419',
    '--secondary-bg': '#1a2f1a',
    '--accent-color': '#4ade80',
    '--canvas-bg': 'radial-gradient(ellipse at bottom, #1a3d1a 0%, #0f1419 100%)',
    '--particle-glow': '#4ade80',
    '--particle-trail': 'rgba(74, 222, 128, 0.3)'
  }
};

// =====================================
// CSS Mixins para Componentes 3D
// =====================================

// Glassmorphism para UI overlays
const glassmorphism = css`
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

// Aceleración GPU para elementos que se animan
const gpuAcceleration = css`
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
`;

// Prevenir interacciones del usuario en elementos de fondo
const preventUserInteraction = css`
  user-select: none;
  pointer-events: none;
  touch-action: none;
`;

// Animaciones smooth para transiciones
const smoothTransition = (property: string = 'all', duration: string = '0.3s') => css`
  transition: ${property} ${duration} cubic-bezier(0.4, 0, 0.2, 1);
`;

// Efectos de glow para elementos UI
const glowEffect = (color: string = 'var(--accent-color)') => css`
  box-shadow:
    0 0 20px ${color}40,
    0 0 40px ${color}20,
    0 0 60px ${color}10;
`;

// Tipografía para UI en experiencias 3D
const uiText = css`
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.02em;
`;

export const mixins = {
  glassmorphism,
  gpuAcceleration,
  preventUserInteraction,
  smoothTransition,
  glowEffect,
  uiText,

  // Overlay para controles
  overlayPosition: (
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  ) => {
    const positions = {
      'top-left': css`
        top: 1rem;
        left: 1rem;
      `,
      'top-right': css`
        top: 1rem;
        right: 1rem;
      `,
      'bottom-left': css`
        bottom: 1rem;
        left: 1rem;
      `,
      'bottom-right': css`
        bottom: 1rem;
        right: 1rem;
      `,
      center: css`
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      `
    };

    return css`
      position: absolute;
      z-index: 10;
      ${positions[position]}
    `;
  },

  // Botones para controles 3D
  controlButton: css`
    ${glassmorphism}
    ${smoothTransition()}
    ${uiText}

    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    outline: none;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      ${glowEffect()}
    }

    &:active {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `
};

// =====================================
// Responsive Breakpoints
// =====================================

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  large: '1440px',
  ultrawide: '1920px'
};

export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  large: `@media (min-width: ${breakpoints.large})`,
  ultrawide: `@media (min-width: ${breakpoints.ultrawide})`,

  // Queries específicas para experiencias 3D
  highRefreshRate: '@media (min-refresh-rate: 120Hz)',
  preferReducedMotion: '@media (prefers-reduced-motion: reduce)',
  touchDevice: '@media (pointer: coarse)',
  highResolution: '@media (-webkit-min-device-pixel-ratio: 2)'
};

// =====================================
// Utility Functions
// =====================================

export const themeUtils = {
  // Aplicar tema dinámicamente
  applyTheme: (themeName: keyof typeof themes) => {
    const theme = themes[themeName];
    const root = document.documentElement;

    for (const [property, value] of Object.entries(theme)) {
      root.style.setProperty(property, value);
    }
  },

  // Detectar capacidades del dispositivo
  getDeviceCapabilities: () => ({
    isHighRefreshRate:
      window.screen && (window.screen as unknown as { refreshRate?: number }).refreshRate! >= 120,
    supportsWebGL2: !!document.createElement('canvas').getContext('webgl2'),
    isTouchDevice: 'ontouchstart' in globalThis,
    prefersReducedMotion: globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
    devicePixelRatio: globalThis.devicePixelRatio || 1
  }),

  // Optimizar performance basado en dispositivo
  getPerformanceSettings: () => {
    const capabilities = themeUtils.getDeviceCapabilities();

    return {
      particleCount: capabilities.isHighRefreshRate ? 5000 : 3000,
      shadowQuality: capabilities.supportsWebGL2 ? 'high' : 'medium',
      postProcessing: !capabilities.isTouchDevice,
      antialias: capabilities.devicePixelRatio < 2
    };
  }
};

export default mixins;
