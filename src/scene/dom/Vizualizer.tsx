import { VizualiserRoot } from '../../ui/styles/Vizualiser.styled';
import type { Emotion } from '@/domain/entities/emotion';
import { getPresetForEmotion } from '@/config/emotion-presets';
import { motion } from 'framer-motion';

type Props = {
  emotion: Emotion | null;
  analyzing?: boolean;
};

const Vizualizer = ({ emotion, analyzing }: Props) => {
  const preset = getPresetForEmotion(emotion?.label);
  const bg = `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`;

  return (
    <VizualiserRoot as={motion.div}
      style={{
        backgroundImage: bg,
        filter: analyzing ? 'saturate(1.15) brightness(1.05)' : 'none',
        transition: 'background-image 280ms ease, filter 240ms ease'
      }}
      animate={
        preset.motion === 'expand'
          ? { scale: [1, 1.03, 1] }
          : preset.motion === 'sway'
            ? { rotate: [-1, 0.2, 1, 0.2, -1] }
            : preset.motion === 'fall'
              ? { y: [0, 2, 0] }
              : preset.motion === 'tremble'
                ? { x: [0, -1.5, 1.5, 0] }
                : preset.motion === 'pulse'
                  ? { scale: [1, 1.02, 0.995, 1] }
                  : preset.motion === 'recoil'
                    ? { scale: [1, 0.995, 1.005, 1] }
                    : { opacity: 1 }
      }
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

export default Vizualizer;
