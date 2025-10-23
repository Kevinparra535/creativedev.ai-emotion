import { useEffect } from 'react';
import { useControls } from 'leva';
import config from '@/config/config';
import { AudioManager } from '@/audio/AudioManager';

export const useAudioLeva = () => {
  const { enabled, ambient, ambientVolume, sfxVolume, hoverSfx } = useControls('Audio', {
    enabled: { value: config.AUDIO.ENABLED },
    ambient: { value: true, label: 'Ambient On' },
    ambientVolume: { value: config.AUDIO.AMBIENT_VOLUME, min: 0, max: 1, step: 0.01 },
    sfxVolume: { value: config.AUDIO.SFX_VOLUME, min: 0, max: 1, step: 0.01 },
    hoverSfx: { value: config.AUDIO.HOVER_ENABLED, label: 'Hover SFX' }
  });

  // initialize/resume context once
  useEffect(() => {
    if (config.AUDIO.RESUME_ON_INTERACTION) AudioManager.resumeOnInteraction();
  }, []);

  // volumes
  useEffect(() => {
    AudioManager.setAmbientVolume(enabled && ambient ? ambientVolume : 0);
  }, [enabled, ambient, ambientVolume]);

  useEffect(() => {
    AudioManager.setSfxVolume(enabled && hoverSfx ? sfxVolume : 0);
  }, [enabled, hoverSfx, sfxVolume]);

  // ambient start/stop
  useEffect(() => {
    if (!enabled) {
      AudioManager.stopAmbient();
      return;
    }
    if (ambient) AudioManager.playAmbient().catch(() => {});
    else AudioManager.stopAmbient();
  }, [enabled, ambient]);

  // update config flags at runtime (lightweight)
  useEffect(() => {
    config.AUDIO.ENABLED = enabled;
    config.AUDIO.HOVER_ENABLED = hoverSfx;
  }, [enabled, hoverSfx]);
};
