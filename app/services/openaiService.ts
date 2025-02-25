import { Platform } from 'react-native';

// Import the appropriate implementation based on platform
const openaiService = Platform.OS === 'web' 
  ? require('./openaiServiceWeb').default
  : require('./openaiServiceNative').default;

export const { getChatResponse, openai } = openaiService;
export default openaiService; 