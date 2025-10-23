import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type TextareaHTMLAttributes
} from 'react';

import { InputFieldRoot } from '@/ui/styles/InputField.styled';
type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxAutoHeight?: number; // px, default 300
  minAutoHeight?: number; // px, default 56
};

const PromptInput = forwardRef<HTMLTextAreaElement, Props>(
  ({ maxAutoHeight = 300, minAutoHeight = 20, onChange, value, ...rest }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    const adjustHeight = () => {
      const el = innerRef.current;
      if (!el) return;
      // Reset height to measure scrollHeight correctly
      el.style.height = 'auto';
      const next = Math.min(Math.max(el.scrollHeight, minAutoHeight), maxAutoHeight);
      el.style.height = `${next}px`;
      // Allow scroll only when exceeding max
      el.style.overflowY = el.scrollHeight > maxAutoHeight ? 'auto' : 'hidden';
    };

    useEffect(() => {
      adjustHeight();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, maxAutoHeight, minAutoHeight]);

    return (
      <InputFieldRoot
        ref={innerRef}
        value={value}
        onChange={(e) => {
          adjustHeight();
          onChange?.(e);
        }}
        {...rest}
      />
    );
  }
);

PromptInput.displayName = 'PromptInput';
export default PromptInput;
