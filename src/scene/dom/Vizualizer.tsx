import { motion } from 'framer-motion';

import { getPresetForEmotion } from '@/config/emotion-presets';

import type { Emotion } from '@/domain/emotion';
import { GrainOverlay, VizualiserRoot } from '@/ui/styles/Vizualiser.styled';

type Props = {
  emotion: Emotion | null;
  analyzing?: boolean;
  intensity?: number; // 0..1
  speed?: number; // 0..1
  grain?: number; // 0..1
  styleName?: string; // Minimal | Dreamy | Cyber | Nature | Memphis | Glitch
};

const Vizualizer = ({
  emotion,
  analyzing,
  intensity = 0.5,
  speed = 0.5,
  grain = 0.1,
  styleName = 'Minimal'
}: Props) => {
  const preset = getPresetForEmotion(emotion?.label);
  const bg = `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`;
  // Style multipliers
  const styleSpeedMul =
    styleName === 'Dreamy' ? 1.3 : styleName === 'Cyber' ? 0.85 : styleName === 'Glitch' ? 0.6 : styleName === 'Nature' ? 1.1 : 1.0;
  const styleAmpMul = styleName === 'Glitch' ? 1.2 : styleName === 'Dreamy' ? 1.1 : 1.0;
  const dur = Math.max(0.5, (1.8 - speed * 1.2) * styleSpeedMul);
  const amp = (1 + intensity * 0.05) * styleAmpMul;

  return (
    <VizualiserRoot
      as={motion.div}
      style={{
        backgroundImage: bg,
        filter: analyzing ? 'saturate(1.15) brightness(1.05)' : 'none',
        transition: 'background-image 280ms ease, filter 240ms ease'
      }}
      animate={
        preset.motion === 'expand'
          ? { scale: [1, amp, 1] }
          : preset.motion === 'sway'
            ? { rotate: [-1 * amp, 0.2, 1 * amp, 0.2, -1 * amp] }
            : preset.motion === 'fall'
              ? { y: [0, 2 * amp, 0] }
              : preset.motion === 'tremble'
                ? { x: [0, -1.5 * amp, 1.5 * amp, 0] }
                : preset.motion === 'pulse'
                  ? { scale: [1, 1.02 * amp, 0.995, 1] }
                  : preset.motion === 'recoil'
                    ? { scale: [1, 0.995, 1.005 * amp, 1] }
                    : { opacity: 1 }
      }
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
    >
      <GrainOverlay style={{ opacity: Math.max(0, Math.min(0.4, grain)) }} />
    </VizualiserRoot>
  );
};

export default Vizualizer;
