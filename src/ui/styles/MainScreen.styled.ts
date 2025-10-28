import { motion } from 'framer-motion';
import styled from 'styled-components';

import { spacing } from './scssTokens';

export const MainRoot = styled.main`
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  width: 100%;
  height: auto;
  overflow: hidden;
  /* backdrop-filter: blur(10px); */
`;

export const AnimShape = styled(motion.div)`
  position: absolute;
  z-index: 1;
  width: 80px;
  height: 80px;
  border-radius: ${spacing.space_x5};
  background: conic-gradient(from 180deg at 50% 50%, #ff7a59, #ffd166, #7bdff2, #bdb2ff, #ff7a59);
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.35));
  pointer-events: none;
  will-change: transform, width, height, border-radius, rotate;
`;
