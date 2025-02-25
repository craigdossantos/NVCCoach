import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend service
});

const SYSTEM_PROMPT = `You are an NVC (Nonviolent Communication) coach. Your role is to:
1. Help users practice NVC principles in various scenarios
2. Provide constructive feedback on their responses
3. Guide them towards more empathetic and effective communication
4. Focus on the four components of NVC: observations, feelings, needs, and requests

If the user says "yes" or indicates they want to start, provide a realistic scenario that they might encounter in their daily life where NVC would be helpful.

Always maintain a supportive and non-judgmental tone.`;

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

let conversationHistory: Message[] = [
  { role: 'system', content: SYSTEM_PROMPT }
];

export async function getChatResponse(
  userMessage: string,
  onPartialResponse?: (partial: string) => void
) {
  try {
    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    if (onPartialResponse) {
      // Streaming response
      const stream = await openai.chat.completions.create({
        messages: conversationHistory,
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        
        if (onPartialResponse) {
          onPartialResponse(fullResponse);
        }
      }

      // Add assistant's response to history
      conversationHistory.push({ role: 'assistant', content: fullResponse });
      return fullResponse;
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        messages: conversationHistory,
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that response.";
      
      // Add assistant's response to history
      conversationHistory.push({ role: 'assistant', content: responseText });
      return responseText;
    }
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    return "I apologize, but I'm having trouble processing your message right now. Please try again.";
  }
}

// Add default export
const openaiService = {
  openai,
  getChatResponse
};

export { openai };
export default openaiService; 