import styled from 'styled-components';

export const CanvasRoot = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  min-height: 100dvh;
  background:
    radial-gradient(1200px 600px at 50% 0%, rgba(255, 255, 255, 0.04), transparent),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.02));
  backdrop-filter: blur(4px);
`;
