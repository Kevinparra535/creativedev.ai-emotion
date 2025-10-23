import { forwardRef } from 'react';

import { InputFieldRoot } from '@/ui/styles/InputField.styled';
type Props = React.InputHTMLAttributes<HTMLInputElement>;

const PromptInput = forwardRef<HTMLInputElement, Props>(({ ...props }, ref) => {
  return <InputFieldRoot ref={ref} {...props} />;
});

PromptInput.displayName = 'PromptInput';
export default PromptInput;
