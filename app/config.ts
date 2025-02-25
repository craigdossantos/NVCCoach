// Use environment variables for API keys
// NEVER hardcode API keys in source code
import { Platform } from 'react-native';

// For web, use EXPO_PUBLIC_OPENAI_API_KEY, otherwise use OPENAI_API_KEY
export const OPENAI_API_KEY = Platform.OS === 'web' 
  ? process.env.EXPO_PUBLIC_OPENAI_API_KEY || '' 
  : process.env.OPENAI_API_KEY || '';

const config = {
  OPENAI_API_KEY
};

export default config; 