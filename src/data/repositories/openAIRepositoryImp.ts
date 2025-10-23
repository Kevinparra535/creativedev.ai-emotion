import { inject, injectable } from 'inversify';
import { makeAutoObservable } from 'mobx';

import { TYPES } from '@/config/types';

import type { OpenAIRepository } from '@/domain/repositories/openAIRepository';
import type { Emotion } from '@/domain/entities/emotion';
import type { OpenAIService } from '@/domain/services/openIAService';

@injectable()
export class OpenAiRepositoryImpl implements OpenAIRepository {
  constructor(@inject(TYPES.OpenAIService) private service: OpenAIService) {
    makeAutoObservable(this);
  }

  async analyzeText(text: string, options?: { signal?: AbortSignal }): Promise<Emotion> {
    return this.service.analyzeText(text, options);
  }
}
