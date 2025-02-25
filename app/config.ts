// Use environment variables for API keys
// NEVER hardcode API keys in source code
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const config = {
  OPENAI_API_KEY
};

export default config; 