// Centralized font URLs for 3D text (drei/Text via troika)
// IMPORTANT: Import assets so Vite bundles and fingerprints them for production.
// Do NOT reference /src/... paths directly — those break after build/preview.

import MontserratBoldItalicUrl from '@/ui/assets/fonts/Montserrat/Montserrat-BoldItalic.ttf';
import MontserratSemiBoldUrl from '@/ui/assets/fonts/Montserrat/Montserrat-SemiBold.ttf';
import PoppinsMediumUrl from '@/ui/assets/fonts/Poppins/Poppins-Medium.ttf';
import PoppinsRegularUrl from '@/ui/assets/fonts/Poppins/Poppins-Regular.ttf';

export const Fonts3D = {
  heading: MontserratSemiBoldUrl,
  headingBold: MontserratBoldItalicUrl,
  body: PoppinsMediumUrl,
  bodyRegular: PoppinsRegularUrl,
};

export default Fonts3D;
