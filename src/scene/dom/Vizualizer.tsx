import { motion } from 'framer-motion';
import { GrainOverlay, VizualiserRoot } from '@/ui/styles/Vizualiser.styled';
import { getPresetForEmotion } from '@/config/emotion-presets';
import type { Emotion } from '@/domain/emotion';

type Props = {
  emotion: Emotion | null;
  analyzing?: boolean;
  intensity?: number; // 0..1
  speed?: number; // 0..1
  grain?: number; // 0..1
};

const Vizualizer = ({ emotion, analyzing, intensity = 0.5, speed = 0.5, grain = 0.1 }: Props) => {
  const preset = getPresetForEmotion(emotion?.label);
  const bg = `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`;
  const dur = Math.max(0.5, 1.8 - speed * 1.2);
  const amp = 1 + intensity * 0.05;

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
