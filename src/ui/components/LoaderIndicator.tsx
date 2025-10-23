import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { fontSize, spacing } from '../styles/scssTokens';

type Props = {
  reading: boolean;
};

const LoaderIndicator = ({ reading = true }: Props) => {
  return (
    <AnimatePresence>
      {reading && (
        <Indicator
          aria-live='polite'
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
        >
          <span>Leyendo tu tono…</span>
          <Dots aria-hidden='true'>
            {[0, 1, 2].map((i) => (
              <Dot
                key={i}
                animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.12
                }}
              />
            ))}
          </Dots>
        </Indicator>
      )}
    </AnimatePresence>
  );
};

const Indicator = styled(motion.output)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: ${spacing.space} ${spacing.space_x2};
  border-radius: ${spacing.space_x5};
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-size: ${fontSize(10)};
  backdrop-filter: blur(6px);
`;

const Dots = styled.div`
  display: inline-flex;
  gap: 6px;
`;

const Dot = styled(motion.span)`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.85;
`;

export default LoaderIndicator;
