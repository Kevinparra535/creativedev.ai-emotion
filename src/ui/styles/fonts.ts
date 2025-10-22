import { createGlobalStyle } from 'styled-components';

// Global font-face declarations and CSS variables for easy use in styled-components
// We ship TrueType fonts; consider adding WOFF2 for optimal web delivery if available.

export const GlobalFonts = createGlobalStyle`
  /* Poppins */
  @font-face {
    font-family: 'Poppins';
    src: url('/src/ui/assets/fonts/Poppins/Poppins-Light.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url('/src/ui/assets/fonts/Poppins/Poppins-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url('/src/ui/assets/fonts/Poppins/Poppins-Medium.ttf') format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url('/src/ui/assets/fonts/Poppins/Poppins-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url('/src/ui/assets/fonts/Poppins/Poppins-Bold.ttf') format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  /* Montserrat */
  @font-face {
    font-family: 'Montserrat';
    src: url('/src/ui/assets/fonts/Montserrat/Montserrat-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url('/src/ui/assets/fonts/Montserrat/Montserrat-Medium.ttf') format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url('/src/ui/assets/fonts/Montserrat/Montserrat-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url('/src/ui/assets/fonts/Montserrat/Montserrat-BoldItalic.ttf') format('truetype');
    font-weight: 700;
    font-style: italic;
    font-display: swap;
  }

  :root {
    /* Expose font tokens as CSS variables for easy use */
    --font-body: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    --font-heading: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  }
`;

export default GlobalFonts;
