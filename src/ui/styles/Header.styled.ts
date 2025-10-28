import styled, { keyframes } from 'styled-components';

import { cssVariables } from '@/ui/styles/base';

const slideDown = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const HeaderRoot = styled.header`
  padding: ${cssVariables.spacing.xl};
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 99;
  width: 100%;
  height: 100px;
  transition: all 0.3s ease-in-out;
  animation: ${slideDown} 1s ease-in-out 0.2s both;
  background-color: transparent;
`;

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;

  img {
    display: none;
    width: 50px;
    height: 50px;
    aspect-ratio: 1 / 1;
    margin-right: ${cssVariables.spacing.md};
  }

  h1 {
    font-size: 40px;
    line-height: 1.1;
    transition: all 0.3s ease-in-out;
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${cssVariables.spacing.xl};

  span, a {
    font-size: 14px;
    color: var(--text-secondary);
    font-family: inherit;
    font-weight: 300;
    line-height: 1.4;
    transition: all 0.3s ease-in-out;
  }

  span:last-child {
    font-weight: 500;
    margin-top: 4px;
    color: var(--text-primary);
    transition: all 0.3s ease-in-out;
  }
`;

export const HeaderActions = styled.div`
  a {
    text-decoration: none;
    font-weight: 500;
    color: var(--text-primary);
    transition: all 0.3s ease-in-out;
  }
`;

export const HeaderButton = styled.button`
  padding: ${cssVariables.spacing.md} ${cssVariables.spacing.xl};
  border: none;
  font-family: inherit;
  border-radius: 50px;
  color: var(--text-primary);
  cursor: pointer;
  background-color: var(--secondary-bg);
  font-size: 13px;
`;
