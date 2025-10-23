import styled from 'styled-components';
import { spacing } from './scssTokens';

export const CanvasRoot = styled.main`
  padding: ${spacing.space_x3};
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  width: auto;
  height: auto;
  overflow: hidden;
  backdrop-filter: blur(4px);
`;
