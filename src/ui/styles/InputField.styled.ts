import styled from 'styled-components';
import { fonts, fontSize, spacing } from './scssTokens';

export const InputFieldRoot = styled.textarea`
  padding: ${spacing.space_x2} ${spacing.space_x3};
  position: relative;
  z-index: 2;
  width: clamp(280px, 50vw, 640px);
  min-height: 20px;
  max-height: 200px;
  border-radius: ${spacing.space_x5};
  border: 1px solid rgba(255, 255, 255, 0.16);
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: ${fontSize(18)};
  line-height: 1.35;
  font-family: ${fonts.body};
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  resize: none;
  overflow-y: auto;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;
