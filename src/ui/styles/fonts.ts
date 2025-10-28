import { createGlobalStyle } from 'styled-components';

// Import font assets so Vite emits hashed URLs and CSS @font-face works after build.
import MontserratBoldItalicUrl from '@/ui/assets/fonts/Montserrat/Montserrat-BoldItalic.ttf';
import MontserratMediumUrl from '@/ui/assets/fonts/Montserrat/Montserrat-Medium.ttf';
import MontserratRegularUrl from '@/ui/assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratSemiBoldUrl from '@/ui/assets/fonts/Montserrat/Montserrat-SemiBold.ttf';
import PoppinsBoldUrl from '@/ui/assets/fonts/Poppins/Poppins-Bold.ttf';
import PoppinsLightUrl from '@/ui/assets/fonts/Poppins/Poppins-Light.ttf';
import PoppinsMediumUrl from '@/ui/assets/fonts/Poppins/Poppins-Medium.ttf';
import PoppinsRegularUrl from '@/ui/assets/fonts/Poppins/Poppins-Regular.ttf';
import PoppinsSemiBoldUrl from '@/ui/assets/fonts/Poppins/Poppins-SemiBold.ttf';

// Global font-face declarations and CSS variables for easy use in styled-components
// We ship TrueType fonts; consider adding WOFF2 for optimal web delivery if available.

export const GlobalFonts = createGlobalStyle`
  /* Poppins */
  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsLightUrl}) format('truetype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsRegularUrl}) format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsMediumUrl}) format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsSemiBoldUrl}) format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsBoldUrl}) format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  /* Montserrat */
  @font-face {
    font-family: 'Montserrat';
    src: url(${MontserratRegularUrl}) format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url(${MontserratMediumUrl}) format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url(${MontserratSemiBoldUrl}) format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url(${MontserratBoldItalicUrl}) format('truetype');
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
