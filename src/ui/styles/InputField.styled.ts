import styled from 'styled-components';

export const InputFieldRoot = styled.input`
  position: relative;
  z-index: 2;
  width: clamp(280px, 50vw, 640px);
  height: 56px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;
