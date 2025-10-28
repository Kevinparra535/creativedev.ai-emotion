import { useEffect, useRef, useState } from 'react';

import type { Emotion } from '@/domain/emotion';
import { analyzeText } from '@/services/universeGraph';

type State = {
  emotion: Emotion | null;
  analyzing: boolean;
  error?: string;
};

export const useEmotionEngine = (text: string, debounceMs = 350): State => {
  const [state, setState] = useState<State>({ emotion: null, analyzing: false });
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // cancel previous debounce
    if (timerRef.current) globalThis.clearTimeout(timerRef.current);
    // cancel previous request
    abortRef.current?.abort();

    if (!text || !text.trim()) {
      setState((s) => ({ ...s, analyzing: false, error: undefined, emotion: null }));
      return;
    }

    setState((s) => ({ ...s, analyzing: true, error: undefined }));

    timerRef.current = globalThis.setTimeout(async () => {
      try {
        abortRef.current = new AbortController();
        const emotion = await analyzeText(text);
        setState({ emotion, analyzing: false });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'analysis-failed';
        setState((s) => ({ ...s, analyzing: false, error: message }));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) globalThis.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [text, debounceMs]);

  return state;
};
