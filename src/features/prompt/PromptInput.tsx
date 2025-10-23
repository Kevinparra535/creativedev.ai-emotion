import { forwardRef, type RefObject } from 'react';

import { InputFieldRoot } from '@/ui/styles/InputField.styled';
import debounce from '@/utils/debounce';

type Props = {
  ref: RefObject<HTMLInputElement | null>;
  type?: string;
  placeholder?: string;
};

const PromptInput = forwardRef<HTMLInputElement, Props>(({ ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input changed:', e.target.value);
  };

  return <InputFieldRoot ref={ref} {...props} onChange={debounce(handleChange, 300)} />;
});

PromptInput.displayName = 'PromptInput';
export default PromptInput;
