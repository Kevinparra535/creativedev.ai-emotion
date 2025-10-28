import styled, { keyframes } from 'styled-components';

import { fonts, scssMedia, spacing } from './scssTokens';

// Wrapper to stack highlights behind the textarea
export const HighlightWrapper = styled.div`
  position: relative;
  width: clamp(280px, 95vw, 640px);

  ${scssMedia['desktop-s']} {
    width: clamp(280px, 50vw, 640px);
  }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// The background highlights layer that mirrors the textarea content
export const HighlightsLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: ${spacing.space_x2} ${spacing.space_x3};
  border-radius: ${spacing.space_x5};
  border: 1px solid transparent; /* match textarea border width for identical content box */
  box-sizing: border-box;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow: hidden;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.92); /* default text color */
  font-size: 18px;
  line-height: 1.35;
  font-family: ${fonts.body};

  .hi {
    background-image: -webkit-linear-gradient(90deg, var(--c1), var(--c2));
    background-image: linear-gradient(90deg, var(--c1), var(--c2));
    background-size: 200% 200%;
    animation: ${gradientShift} 6s ease infinite;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    border-radius: 6px;
    padding: 0; /* avoid layout shift vs textarea text */
    opacity: 1;
  }

  .placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const InputFieldRoot = styled.textarea`
  padding: ${spacing.space_x2} ${spacing.space_x3};
  position: relative;
  z-index: 2;
  width: clamp(280px, 95vw, 640px);
  box-sizing: border-box;
  min-height: 56px;
  max-height: 200px;
  border-top-left-radius: ${spacing.space_x5};
  border-top-right-radius: ${spacing.space_x5};
  border-bottom-left-radius: ${spacing.space_x5};
  border-bottom-right-radius: ${spacing.space_x5};
  border: 1px solid rgba(255, 255, 255, 0.16);
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: transparent; /* hide textarea text; overlay shows colored text */
  caret-color: #fff;
  font-size: 18px;
  line-height: 1.35;
  font-family: ${fonts.body};
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  resize: none;
  overflow-y: auto;

  &::placeholder {
    color: transparent; /* hidden; overlay renders placeholder */
  }

  ${scssMedia['desktop-s']} {
    width: clamp(280px, 50vw, 640px);
  }
`;
