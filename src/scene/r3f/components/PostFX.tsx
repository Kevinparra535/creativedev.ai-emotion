import type { ReactElement } from 'react';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette
} from '@react-three/postprocessing';
import { Vector2 } from 'three';

import { useVisualLeva } from '@/hooks/useVisualLeva';

const PostFX = () => {
  const { post } = useVisualLeva();
  const children: ReactElement[] = [];
  if (post.bloomEnabled) {
    children.push(
      <Bloom
        key='bloom'
        luminanceThreshold={post.bloomThreshold}
        luminanceSmoothing={post.bloomSmoothing}
        intensity={post.bloomIntensity}
        height={300}
      />
    );
  }
  if (post.noiseEnabled) {
    const opacity = Math.max(0, post.noiseOpacity);
    if (opacity > 0) children.push(<Noise key='noise' opacity={opacity} />);
  }
  const wantVignette = post.vignetteEnabled;
  if (wantVignette) {
    children.push(
      <Vignette
        key='vignette'
        eskil={false}
        offset={post.vignetteOffset}
        darkness={post.vignetteDarkness}
      />
    );
  }
  const wantChroma = post.chromaEnabled;
  if (wantChroma) {
    children.push(
      <ChromaticAberration
        key='chroma'
        offset={new Vector2(post.chromaOffset, -post.chromaOffset)}
      />
    );
  }
  return <EffectComposer>{children}</EffectComposer>;
};
export default PostFX;
