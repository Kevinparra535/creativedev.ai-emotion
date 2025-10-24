import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  useMemo,
  useRef,
  type TextareaHTMLAttributes
} from 'react';

import { HighlightWrapper, HighlightsLayer, InputFieldRoot } from '@/ui/styles/InputField.styled';
import { getPresetForEmotion } from '@/config/emotion-presets';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxAutoHeight?: number; // px, default 200
  minAutoHeight?: number; // px, default 56
};

const PromptInput = forwardRef<HTMLTextAreaElement, Props>(
  ({ maxAutoHeight = 200, minAutoHeight = 56, onChange, value = '', ...rest }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const highlightsRef = useRef<HTMLDivElement | null>(null);
    const { placeholder, ...restProps } = rest;

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    const adjustHeight = () => {
      const el = innerRef.current;
      if (!el) return;
      // Reset height to measure scrollHeight correctly
      el.style.height = 'auto';
      const next = Math.min(Math.max(el.scrollHeight, minAutoHeight), maxAutoHeight);
      el.style.height = `${next}px`;
      // Allow scroll only when exceeding max
      el.style.overflowY = el.scrollHeight > maxAutoHeight ? 'auto' : 'hidden';
      // Match overlay height
      if (highlightsRef.current) highlightsRef.current.style.height = `${next}px`;
    };

    const syncScroll = () => {
      const el = innerRef.current;
      const hl = highlightsRef.current;
      if (!el || !hl) return;
      hl.scrollTop = el.scrollTop;
      hl.scrollLeft = el.scrollLeft;
    };

    // Emotion keyword patterns mapped to base labels for presets
    const patterns = useMemo(
      () =>
        [
          {
            key: 'joy',
            re: /(felicidad|feliz|alegr(?:ía|ia)|alegre|gozo|content(?:o|a)|joy|happy)/gi
          },
          {
            key: 'sadness',
            re: /(tristeza|triste|depresi(?:ón|on)|deprimid(?:o|a)|pena|melancol(?:ía|ia)|sadness|sad)/gi
          },
          {
            key: 'fear',
            re: /(miedo|temor|ansiedad|ansios(?:o|a)|nervios|asustad(?:o|a)|p(?:ánico|anico)|fear|afraid|anxious)/gi
          },
          {
            key: 'anger',
            re: /(enojo|ira|rabia|furia|molest(?:o|a)|c(?:ólera|olera)|anger|angry|mad)/gi
          },
          {
            key: 'nostalgia',
            re: /(nostalgia|nost(?:álgic|algic)(?:o|a)|recuerdo[s]?|añoro|extrañ(?:o|a)|nostalgic)/gi
          },
          {
            key: 'calm',
            re: /(calma|tranquil(?:o|a)|serenidad|seren(?:o|a)|paz|relajad(?:o|a)|calm|peace|relaxed)/gi
          }
        ] as Array<{ key: string; re: RegExp }>,
      []
    );

    const escapeHtml = (s: string) =>
      s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const buildHighlightsHtml = useCallback(
      (raw: string) => {
        if (!raw) return '';
        type Match = { start: number; end: number; key: string };
        const matches: Match[] = [];
        for (const { key, re } of patterns) {
          re.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = re.exec(raw))) {
            matches.push({ start: m.index, end: m.index + m[0].length, key });
          }
        }
        if (!matches.length) return escapeHtml(raw);
        // sort and de-overlap (keep first match precedence)
        matches.sort((a, b) => a.start - b.start || b.end - a.end);
        const filtered: Match[] = [];
        let lastEnd = -1;
        for (const m of matches) {
          if (m.start < lastEnd) continue;
          filtered.push(m);
          lastEnd = m.end;
        }
        // Build HTML with spans and inline CSS vars for gradient stops
        let out = '';
        let cursor = 0;
        for (const m of filtered) {
          if (m.start > cursor) out += escapeHtml(raw.slice(cursor, m.start));
          const preset = getPresetForEmotion(m.key);
          const c1 = preset.colors[0] ?? '#ffffff';
          const c2 = preset.colors[1] ?? preset.colors[0] ?? '#ffffff';
          const segment = escapeHtml(raw.slice(m.start, m.end));
          out += `<span class="hi" style="--c1:${c1};--c2:${c2}">${segment}</span>`;
          cursor = m.end;
        }
        if (cursor < raw.length) out += escapeHtml(raw.slice(cursor));
        return out;
      },
      [patterns]
    );

    const highlightsHtml = useMemo(
      () => buildHighlightsHtml(String(value)),
      [value, buildHighlightsHtml]
    );

    const htmlToRender = useMemo(() => {
      if (String(value).length > 0) return highlightsHtml;
      const ph = typeof placeholder === 'string' ? placeholder : '';
      return ph ? `<span class="placeholder">${escapeHtml(ph)}</span>` : '';
    }, [value, highlightsHtml, placeholder]);

    useEffect(() => {
      adjustHeight();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, maxAutoHeight, minAutoHeight]);

    return (
      <HighlightWrapper>
        <HighlightsLayer
          // aria-hidden
          ref={highlightsRef}
          dangerouslySetInnerHTML={{ __html: htmlToRender + (htmlToRender ? '' : ' ') }}
        />
        <InputFieldRoot
          ref={innerRef}
          value={value}
          onScroll={syncScroll}
          onChange={(e) => {
            adjustHeight();
            onChange?.(e);
            requestAnimationFrame(syncScroll);
          }}
          placeholder={placeholder}
          {...restProps}
        />
      </HighlightWrapper>
    );
  }
);

PromptInput.displayName = 'PromptInput';
export default PromptInput;
