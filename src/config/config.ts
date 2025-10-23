const { VITE_OPENAI_API_KEY, VITE_OPENAI_BASE_URL, VITE_OPENAI_MODEL } = import.meta.env;

const config = {
  OPENAI_API_KEY: VITE_OPENAI_API_KEY || '',
  OPENAI_BASE_URL: VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: VITE_OPENAI_MODEL || 'gpt-4o-mini',
  INPUT_SHIFT_THRESHOLD: 10 // chars
};

export default config;
