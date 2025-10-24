const { VITE_OPENAI_API_KEY, VITE_OPENAI_BASE_URL, VITE_OPENAI_MODEL, VITE_EMOTION_MODE } =
  import.meta.env;

const config = {
  OPENAI_API_KEY: VITE_OPENAI_API_KEY || '',
  OPENAI_BASE_URL: VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: VITE_OPENAI_MODEL || 'gpt-4o-mini',
  INPUT_SHIFT_THRESHOLD: 100, // chars
  // 'online' | 'offline' | 'auto' (auto: online si hay API key, offline en caso contrario)
  EMOTION_MODE: (VITE_EMOTION_MODE as 'online' | 'offline' | 'auto' | undefined) || 'auto',
  // Feature flag: agregar enlaces "energéticos" entre primarias (polarity/transition/cause/function)
  ENABLE_ENERGY_LINKS: true,

  // Clusters planets animations
  PLANET_DUR: 3,
  SAT_DELAY: 0.4,
  SAT_DUR: 3,
  ORBIT_DELAY: 2,
  ORBIT_DUR: 0.6,
  ENERGY_DELAY: 2.3,
  ENERGY_DUR: 0.8,
  CENTER_SCALE: 3, // Global main-planets spacing multiplier (applies to both layouts)

  // Audio defaults and asset mapping
  AUDIO: {
    ENABLED: true,
    HOVER_ENABLED: true,
    RESUME_ON_INTERACTION: true, // try to resume audio context on first pointer/keypress
    HOVER_COOLDOWN_MS: 200,
    AMBIENT_URL: '/audio/ambient.mp3',
    AMBIENT_VOLUME: 0.25,
    SFX_VOLUME: 0.6,
    // Map primary emotion keys to hover SFX
    PLANET_SOUNDS: {
      love: '/audio/hover/love.mp3',
      calm: '/audio/hover/calm.mp3',
      joy: '/audio/hover/joy.mp3',
      nostalgia: '/audio/hover/nostalgic.mp3',
      surprise: '/audio/hover/surprise.mp3',
      anger: '/audio/hover/anger.mp3',
      sadness: '/audio/hover/sadness.mp3',
      fear: '/audio/hover/fear.mp3'
    } as Record<string, string>
  }
  ,
  TEXTURES: {
    ENABLED: false,
    PLANET_KEY: 'joy',
    PACK: 'ravine-rock1-bl',
    ENABLE_DISPLACEMENT: false,
    DISPLACEMENT_SCALE: 0.02
  }
};

export default config;
