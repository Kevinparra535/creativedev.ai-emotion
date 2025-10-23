import styled from 'styled-components';

export const VizualiserRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0%;
  left: 0%;
  width: 100%;
  height: 100%;
  /* background-color: red; */
`;

export const GrainOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: overlay;
  opacity: 0.15;
  background-image: 
    radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
    radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px);
  background-size: 3px 3px, 5px 5px;
  background-position: 0 0, 1px 1px;
`;
