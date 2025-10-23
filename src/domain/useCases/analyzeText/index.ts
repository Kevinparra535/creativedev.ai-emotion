import { inject, injectable } from 'inversify';

import { TYPES } from '@/config/types';

import type { OpenAIRepository } from '@/domain/repositories/openAIRepository';
import type { Emotion } from '@/domain/entities/emotion';
import type { UseCase } from '../useCase';

export interface AddIssuerRequest {
  name: string;
  code: string;
}

@injectable()
export class AnalyzeTextUseCase implements UseCase<string, Emotion> {
  constructor(@inject(TYPES.OpenAIRepository) private repository: OpenAIRepository) {}

  async run(data: string): Promise<Emotion> {
    return await this.repository.analyzeText(data);
  }
}
