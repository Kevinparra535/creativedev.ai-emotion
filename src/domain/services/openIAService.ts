import { inject, injectable } from 'inversify';

import { TYPES } from '@/config/types';

import Logger from '@/utils/logger';
import { OpenAIManager } from '@/data/network/openAIManager';
import type { Emotion } from '../entities/emotion';

@injectable()
export class OpenAIService {
  private logger = new Logger('OpenAIService');

  constructor(@inject(TYPES.OpenAIManager) private openAIManager: OpenAIManager) {}

  async analyzeText(text: string, options?: { signal?: AbortSignal }): Promise<Emotion> {
    return this.openAIManager.analyzeText(text, options);
  }
}
