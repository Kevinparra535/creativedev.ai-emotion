import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { OpenAiRepositoryImpl } from '@/data/repositories/openAIRepositoryImp';
import type { OpenAIRepository } from '@/domain/repositories/openAIRepository';
import { OpenAIService } from '@/domain/services/openIAService';
import { OpenAIManager } from '@/data/network/openAIManager';

const container = new Container({ defaultScope: 'Singleton' });

// Core services
container.bind<OpenAIService>(TYPES.OpenAIService).to(OpenAIService);
container.bind<OpenAIManager>(TYPES.OpenAIManager).to(OpenAIManager);

// Repository bindings (interface token -> implementation)
container.bind<OpenAIRepository>(TYPES.OpenAIRepository).to(OpenAiRepositoryImpl);
// Keep concrete token binding for direct resolutions if used elsewhere
container.bind<OpenAIRepository>(TYPES.OpenAiRepositoryImpl).to(OpenAiRepositoryImpl);

export { container };
