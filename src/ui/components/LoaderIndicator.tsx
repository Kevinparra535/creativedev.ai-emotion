import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

type Props = {
  reading: boolean;
};

const LoaderIndicator = ({ reading }: Props) => {
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
  position: absolute;
  bottom: 20px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-size: 13px;
  line-height: 1;
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
