import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { OpenAiRepositoryImpl } from '@/data/repositories/openAIRepositoryImp';
import type { OpenAIRepository } from '@/domain/repositories/openAIRepository';
import { OpenAIService } from '@/domain/services/openIAService';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<OpenAIRepository>(TYPES.OpenAiRepositoryImpl).to(OpenAiRepositoryImpl);
container.bind<OpenAIService>(TYPES.OpenAIService).to(OpenAIService);

export { container };
