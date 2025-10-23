import config from '@/config/config';

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private interactionArmed = false;

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx;
    type AudioContextCtor = new (contextOptions?: AudioContextOptions) => AudioContext;
    const W = window as Window & {
      webkitAudioContext?: AudioContextCtor;
      AudioContext?: AudioContextCtor;
    };
    const Ctx = (W.AudioContext ?? W.webkitAudioContext)!;
    this.ctx = new Ctx();
    const ctx = this.ctx!;
    this.masterGain = ctx.createGain();
    this.ambientGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.masterGain.connect(ctx.destination);
    this.ambientGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    // apply default volumes
    this.setAmbientVolume(config.AUDIO.AMBIENT_VOLUME);
    this.setSfxVolume(config.AUDIO.SFX_VOLUME);
  return ctx;
  }

  resumeOnInteraction() {
    if (!config.AUDIO.RESUME_ON_INTERACTION || this.interactionArmed) return;
    this.interactionArmed = true;
    const resume = async () => {
      try {
        const ctx = this.ensureContext();
        if (ctx.state === 'suspended') await ctx.resume();
      } catch {
        void 0; // noop
      }
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    const handler = () => {
      resume();
      events.forEach((e) => window.removeEventListener(e, handler, { passive: true } as AddEventListenerOptions));
    };
    events.forEach((e) => window.addEventListener(e, handler, { passive: true } as AddEventListenerOptions));
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (!url) return null;
    if (this.bufferCache.has(url)) return this.bufferCache.get(url)!;
    try {
      const ctx = this.ensureContext();
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      this.bufferCache.set(url, buf);
      return buf;
    } catch (err) {
      console.warn('[Audio] Failed to load', url, err);
      return null;
    }
  }

  setMasterVolume(v: number) {
    if (!this.masterGain) this.ensureContext();
    this.masterGain!.gain.value = Math.max(0, Math.min(1, v));
  }
  setAmbientVolume(v: number) {
    if (!this.ambientGain) this.ensureContext();
    this.ambientGain!.gain.value = Math.max(0, Math.min(1, v));
  }
  setSfxVolume(v: number) {
    if (!this.sfxGain) this.ensureContext();
    this.sfxGain!.gain.value = Math.max(0, Math.min(1, v));
  }

  async playAmbient(url = config.AUDIO.AMBIENT_URL) {
    if (!config.AUDIO.ENABLED) return;
    const buf = await this.loadBuffer(url);
    if (!buf) return;
    this.stopAmbient();
    const ctx = this.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.ambientGain!);
    src.start(0);
    this.ambientSource = src;
  }

  stopAmbient() {
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch { void 0; }
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
  }

  async playOneShot(url: string, detuneCents = 0) {
    if (!config.AUDIO.ENABLED) return;
    const buf = await this.loadBuffer(url);
    if (!buf) return;
    const ctx = this.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    try {
      const node = src as AudioBufferSourceNode & { detune?: AudioParam };
      if (node.detune) node.detune.setValueAtTime(detuneCents, ctx.currentTime);
    } catch { void 0; }
    src.connect(this.sfxGain!);
    src.start(0);
  }

  async playHoverForEmotion(label: string) {
    if (!config.AUDIO.ENABLED || !config.AUDIO.HOVER_ENABLED) return;
    const key = String(label || '').toLowerCase();
    const url = config.AUDIO.PLANET_SOUNDS[key];
    if (!url) return;
    const detune = (Math.random() - 0.5) * 40; // small natural variation
    await this.playOneShot(url, detune);
  }
}

export const AudioManager = new AudioManagerImpl();
export default AudioManager;
