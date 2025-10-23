export const TYPES = {
  OpenAIRepository: Symbol.for('OpenAIRepository'),
  OpenAiRepositoryImpl: Symbol.for('OpenAiRepositoryImpl'),
  OpenAIManager: Symbol.for('OpenAIManager'),
  OpenAIService: Symbol.for('OpenAIService'),
} as const;

export type Types = typeof TYPES;
