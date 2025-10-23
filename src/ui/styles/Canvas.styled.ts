import styled from 'styled-components';

export const CanvasRoot = styled.main`
  position: relative;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  min-height: 100dvh;
  background: transparent;
  backdrop-filter: blur(4px);
`;
