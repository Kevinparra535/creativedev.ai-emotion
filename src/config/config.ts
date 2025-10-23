const { OPENAI_API_KEY } = import.meta.env;

const config = {
  OPENAI_API_KEY: OPENAI_API_KEY || ''
};

export default config;
