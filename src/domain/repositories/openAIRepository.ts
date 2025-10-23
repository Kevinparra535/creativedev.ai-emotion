import type { Emotion } from "../entities/emotion";

export interface OpenAIRepository {
  analyzeText(text: string, options?: { signal?: AbortSignal }): Promise<Emotion>
}
