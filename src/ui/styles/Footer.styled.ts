import styled, { keyframes } from 'styled-components';

import { cssVariables } from './base';
import { colors,spacing } from './scssTokens';

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0px); opacity: 1; }
  `;

export const FooterRoot = styled.footer`
  padding: ${spacing.space_x2} ${cssVariables.spacing.xl};
  position: fixed;
  bottom: 0;
  width: 100%;
  color: var(--text-primary);
  text-align: center;
  font-family: var(--font-body);
  background-color: transparent;
  transition: all 0.3s ease-in-out;
  animation: ${slideUp} 1s ease-in-out 0.2s both;
`;

export const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;

  p {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    margin: 0;
    color: ${colors.light};
  }
`;
