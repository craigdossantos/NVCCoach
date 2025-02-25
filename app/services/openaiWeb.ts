// Web-compatible OpenAI service using fetch directly

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

    // For web, we need to use the streaming fetch API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 500,
        stream: !!onPartialResponse
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Handle streaming response
    if (onPartialResponse) {
      let fullResponse = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Response body is null");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices[0]?.delta?.content || '';
              fullResponse += content;
              onPartialResponse(fullResponse);
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }

      // Add assistant's response to history
      conversationHistory.push({ role: 'assistant', content: fullResponse });
      return fullResponse;
    } else {
      // Handle non-streaming response
      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';
      
      // Add assistant's response to history
      conversationHistory.push({ role: 'assistant', content: responseText });
      return responseText;
    }
  } catch (error: any) {
    console.error('Error in OpenAI request:', error);
    
    // Check for specific error types
    if (error.status === 401) {
      return "There seems to be an issue with the API authentication. Please check your API key.";
    }
    
    if (error.status === 429) {
      return "We've hit the rate limit. Please try again in a moment.";
    }
    
    if (error.status === 500) {
      return "OpenAI's servers are experiencing issues. Please try again later.";
    }
    
    return "I apologize, but I'm having trouble processing your message right now. Please try again.";
  }
}

export default {
  getChatResponse
}; 