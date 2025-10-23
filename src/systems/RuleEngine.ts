import type { EmotionResponse } from '@/domain/emotion';
import { expandFromDominant } from '@/utils/iaUtiils';

export class RuleEngine {
  expand(dom: EmotionResponse) {
    return expandFromDominant(dom);
  }
}
