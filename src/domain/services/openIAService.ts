import { inject, injectable } from 'inversify';

import { OpenAIManager } from '@/data/network/openAIManager';
import type { Emotion } from '../entities/emotion';
import { TYPES } from '@/config/types';

@injectable()
export class OpenAIService {
  constructor(@inject(TYPES.OpenAIManager) private openAIManager: OpenAIManager) {}

  async analyzeText(text: string, options?: { signal?: AbortSignal }): Promise<Emotion> {
    return this.openAIManager.analyzeText(text, options);
  }
}
