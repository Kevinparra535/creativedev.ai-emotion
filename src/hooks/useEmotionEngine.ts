import { useEffect, useRef, useState } from 'react';
import type { Emotion } from '@/domain/entities/emotion';
import type { OpenAIRepository } from '@/domain/repositories/openAIRepository';
import { TYPES } from '@/config/types';
import { container } from '@/config/di';

type State = {
  emotion: Emotion | null;
  analyzing: boolean;
  error?: string;
};

export function useEmotionEngine(text: string, debounceMs = 350): State {
  const [state, setState] = useState<State>({ emotion: null, analyzing: false });
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // cancel previous debounce
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // cancel previous request
    abortRef.current?.abort();

    if (!text || !text.trim()) {
      setState((s) => ({ ...s, analyzing: false, error: undefined, emotion: null }));
      return;
    }

    setState((s) => ({ ...s, analyzing: true, error: undefined }));
    timerRef.current = window.setTimeout(async () => {
      try {
        const repo = container.get<OpenAIRepository>(TYPES.OpenAIRepository);
        abortRef.current = new AbortController();
        const emotion = await repo.analyzeText(text, { signal: abortRef.current.signal });
        setState({ emotion, analyzing: false });
      } catch (e: any) {
        setState((s) => ({ ...s, analyzing: false, error: e?.message ?? 'analysis-failed' }));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [text, debounceMs]);

  return state;
}
