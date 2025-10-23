import type { EmotionResponse } from './emotion';

export type RuleContext = {
  text?: string;
  dominant?: EmotionResponse | null;
};

export type Rule = {
  id: string;
  describe: string;
  apply: (ctx: RuleContext) => Partial<EmotionResponse> | null;
};
