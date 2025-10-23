const {
  VITE_OPENAI_API_KEY,
  VITE_OPENAI_BASE_URL,
  VITE_OPENAI_MODEL,
  VITE_EMOTION_MODE
} = import.meta.env;

const config = {
  OPENAI_API_KEY: VITE_OPENAI_API_KEY || '',
  OPENAI_BASE_URL: VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: VITE_OPENAI_MODEL || 'gpt-4o-mini',
  INPUT_SHIFT_THRESHOLD: 10, // chars
  // 'online' | 'offline' | 'auto' (auto: online si hay API key, offline en caso contrario)
  EMOTION_MODE: (VITE_EMOTION_MODE as 'online' | 'offline' | 'auto' | undefined) || 'auto'
};

export default config;
