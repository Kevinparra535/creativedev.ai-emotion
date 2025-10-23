const { VITE_OPENAI_API_KEY, VITE_OPENAI_BASE_URL, VITE_OPENAI_MODEL, VITE_EMOTION_MODE } =
  import.meta.env;

const config = {
  OPENAI_API_KEY: VITE_OPENAI_API_KEY || '',
  OPENAI_BASE_URL: VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: VITE_OPENAI_MODEL || 'gpt-4o-mini',
  INPUT_SHIFT_THRESHOLD: 10, // chars
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
  CENTER_SCALE: 3 // Global main-planets spacing multiplier (applies to both layouts)
};

export default config;
