// Native-only implementation that imports OpenAI
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
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

async function getChatResponse(
  userMessage: string,
  onPartialResponse?: (partial: string) => void
) {
  try {
    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    const stream = await openai.chat.completions.create({
      messages: conversationHistory,
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500,
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
  } catch (error: any) {
    console.error('Error in OpenAI request:', error);
    return "I apologize, but I'm having trouble processing your message right now. Please try again.";
  }
}

export default {
  getChatResponse,
  openai
}; 