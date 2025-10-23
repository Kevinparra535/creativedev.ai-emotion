import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type ChangeEvent
} from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import styled from 'styled-components';
import { Leva } from 'leva';

import PromptInput from '@/features/prompt/PromptInput';
import LoaderIndicator from './LoaderIndicator';

import { useEmotionEngine } from '@/hooks/useEmotionEngine';

import { CanvasRoot } from '@/ui/styles/Canvas.styled';
import config from '@/config/config';
import { spacing } from '../styles/scssTokens';
import { useEmotionStore } from '@/stores/emotionStore';

const AnimShape = styled(motion.div)`
  position: absolute;
  z-index: 1;
  width: 80px;
  height: 80px;
  border-radius: ${spacing.space_x5};
  background: conic-gradient(from 180deg at 50% 50%, #ff7a59, #ffd166, #7bdff2, #bdb2ff, #ff7a59);
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.35));
  pointer-events: none;
  will-change: transform, width, height, border-radius, rotate;
`;

const Canvas = () => {
  const [text, setText] = useState('');
  const [target, setTarget] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showShape, setShowShape] = useState(true);
  const [reading, setReading] = useState(false);
  const [shiftY, setShiftY] = useState<number>(Math.round(window.innerHeight * 0.3));

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimer = useRef<number | null>(null);

  const controls = useAnimationControls();
  const inputControls = useAnimationControls();

  const { emotion, analyzing } = useEmotionEngine(text, 400);
  const setCurrentEmotion = useEmotionStore((s) => s.setCurrent);

  useEffect(() => {
    setCurrentEmotion(emotion ?? null);
  }, [emotion, setCurrentEmotion]);

  const moveToBottom = useCallback(() => {
    if (!inputRef.current) return;
    void inputControls.start({ y: shiftY }, { duration: 0.3, ease: 'easeInOut' });
  }, [inputControls, shiftY]);

  const moveToTop = useCallback(() => {
    if (!inputRef.current) return;
    void inputControls.start({ y: 0 }, { duration: 0.3, ease: 'easeInOut' });
  }, [inputControls]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const onType = useCallback(() => {
    setReading(true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setReading(false), 700);
  }, []);

  useEffect(() => {
    const onResize = () => setShiftY(Math.round(window.innerHeight * 0.35));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Measure input size on mount and on resize
  useLayoutEffect(() => {
    const measure = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setTarget({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (inputRef.current) ro.observe(inputRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (text.length >= config.INPUT_SHIFT_THRESHOLD) moveToBottom();
    else moveToTop();
    // re-run when shiftY changes so position stays consistent across resizes
  }, [text, shiftY, moveToBottom, moveToTop]);

  // Typing indicator debounce: show while user types, hide after idle
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.addEventListener('input', onType);
    el.addEventListener('keydown', onType);

    return () => {
      el.removeEventListener('input', onType);
      el.removeEventListener('keydown', onType);

      if (typingTimer.current) window.clearTimeout(typingTimer.current);
    };
  }, [onType]);

  // Run intro animation once size is known
  useEffect(() => {
    if (!target.width || !target.height) return;

    let cancelled = false;
    const run = async () => {
      // start as circle
      controls.set({ width: 80, height: 80, borderRadius: 999, rotate: 0, opacity: 0.95 });
      // spin
      await controls.start({ rotate: 360 }, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
      if (cancelled) return;
      // stabilize rotation
      await controls.start({ rotate: 0 }, { duration: 0.1 });
      if (cancelled) return;
      // morph to square
      await controls.start(
        { borderRadius: spacing.space_x5 },
        { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      );
      if (cancelled) return;
      // expand to match input size
      await controls.start(
        { width: target.width, height: target.height },
        { type: 'spring', stiffness: 220, damping: 28 }
      );
      if (cancelled) return;
      // quick "breathing" pulse to feel alive
      await controls.start(
        { scale: [1, 1.03, 0.985, 1], rotate: [-1.2, 0, 1.2, 0] },
        { duration: 0.7, ease: 'easeInOut' }
      );
      if (cancelled) return;
      // fade out shape, then unmount
      await controls.start({ opacity: 0 }, { duration: 0.45, ease: 'easeInOut' });
      if (cancelled) return;
      setShowShape(false);
      // reveal input
      await inputControls.start({ opacity: 1, y: 0 }, { duration: 0.35, ease: 'easeInOut' });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [target.width, target.height, controls, inputControls]);

  return (
    <CanvasRoot>
      {/* animated background shape */}
      {showShape && <AnimShape aria-hidden='true' animate={controls} />}
      {/* input on top (fades in after intro) */}
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={inputControls}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <LoaderIndicator reading={reading || analyzing} />

        <PromptInput
          ref={inputRef}
          value={text}
          onChange={handleChange}
          placeholder='Describe how your feeling today...'
        />
      </motion.div>

      {/* Leva panel */}
      <Leva titleBar={{ title: 'Emotion Controls' }} />
    </CanvasRoot>
  );
};

export default Canvas;
