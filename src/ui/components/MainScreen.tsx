import { type ChangeEvent,useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAnimationControls } from 'framer-motion';

import { useAudioLeva } from '@/hooks/useAudioLeva';
// import Vizualizer from '@/scene/dom/Vizualizer';
import { useEmotionCoordinator } from '@/hooks/useEmotionCoordinator';

import { useEmotionStore } from '@/stores/emotionStore';
// import config from '@/config/config';
import { useUIStore } from '@/stores/uiStore';

import { spacing } from '../styles/scssTokens';
import LoaderIndicator from './LoaderIndicator';
import PromptInput from '@/features/prompt/PromptInput';
import { useUniverse } from '@/state/universe.store';
import { AnimShape, MainRoot } from '@/ui/styles/MainScreen.styled';

const MainScreen = () => {
  const [text, setText] = useState('');
  const [target, setTarget] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showShape, setShowShape] = useState(true);
  // const [reading, setReading] = useState(false);
  // const [shiftY, setShiftY] = useState<number>(Math.round(window.innerHeight * 0.3));

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const controls = useAnimationControls();
  const inputControls = useAnimationControls();

  const { emotion, emotions, links, galaxies, analyzing } = useEmotionCoordinator(text, 500);
  const setCurrentEmotion = useEmotionStore((s) => s.setCurrent);
  const setUniverseData = useUniverse((s) => s.setData);
  const thinking = useUIStore((s) => s.thinking);
  const setThinking = useUIStore((s) => s.setThinking);

  // Wire audio controls (Leva) and auto-resume on interaction
  useAudioLeva();

  // Leva: emotion visuals + transparency monitors
  // Emotion Visuals (v1) removed

  // Sync coordinator outputs to stores and UI thinking flag
  useEffect(() => {
    setCurrentEmotion(emotion ?? null);
  }, [emotion, setCurrentEmotion]);

  useEffect(() => {
    setUniverseData({ emotions, links, galaxies });
  }, [emotions, links, galaxies, setUniverseData]);

  useEffect(() => {
    setThinking(analyzing);
  }, [analyzing, setThinking]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // useEffect(() => {
  //   const onResize = () => setShiftY(Math.round(window.innerHeight * 0.35));
  //   window.addEventListener('resize', onResize);
  //   return () => window.removeEventListener('resize', onResize);
  // }, []);

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
    <MainRoot>
      {/* DOM visualizer background driven by current emotion and Leva controls */}
      {/* <Vizualizer
        emotion={emotion}
        analyzing={thinking || analyzing}
        intensity={intensity}
        speed={speed}
        grain={grain}
        styleName={style}
      /> */}
      {/* animated background shape */}
      {showShape && <AnimShape aria-hidden='true' animate={controls} />}

      <LoaderIndicator reading={thinking || analyzing} />

      {/* input on top (fades in after intro) */}

      <PromptInput
        ref={inputRef}
        value={text}
        onChange={handleChange}
        placeholder='Describe how your feeling today...'
      />
    </MainRoot>
  );
};

export default MainScreen;
