const { OPENAI_API_KEY } = import.meta.env;

const config = {
  OPENAI_API_KEY: OPENAI_API_KEY || '',
  OPENAI_BASE_URL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
};

export default config;
