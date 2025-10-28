import { useEffect, useRef, useState } from 'react';
import type { Emotion } from '@/domain/emotion';
import type { Link } from '@/domain/link';
import type { Galaxy } from '@/domain/galaxy';
import { emotionService } from '@/services/EmotionServiceFactory';

export type CoordResult = {
  emotion: Emotion | null;
  emotions: Emotion[];
  links: Link[];
  galaxies: Galaxy[];
  analyzing: boolean;
  error?: string;
};

export function useEmotionCoordinator(text: string, debounceMs = 450): CoordResult {
  const [state, setState] = useState<CoordResult>({
    emotion: null,
    emotions: [],
    links: [],
    galaxies: [],
    analyzing: false
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReqId = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!text || !text.trim()) {
      setState({ emotion: null, emotions: [], links: [], galaxies: [], analyzing: false });
      return;
    }

    setState((s) => ({ ...s, analyzing: true, error: undefined }));
    const reqId = ++lastReqId.current;

    timerRef.current = setTimeout(async () => {
      try {
        const { emotions, links, galaxies } = await emotionService.analyzeToGraph(text);
        // derive a primary emotion for UI (top by intensity/score)
        const primary = emotions
          .slice()
          .sort((a, b) => {
            const as = typeof a.intensity === 'number' ? a.intensity : (a.meta as { score?: number } | undefined)?.score ?? 0.6;
            const bs = typeof b.intensity === 'number' ? b.intensity : (b.meta as { score?: number } | undefined)?.score ?? 0.6;
            return bs - as;
          })[0] ?? null;
        if (reqId !== lastReqId.current) return; // stale
        setState({ emotion: primary, emotions, links, galaxies, analyzing: false });
      } catch (e) {
        if (reqId !== lastReqId.current) return; // stale
        const msg = e instanceof Error ? e.message : 'analysis-failed';
        setState((s) => ({ ...s, analyzing: false, error: msg }));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, debounceMs]);

  return state;
}
