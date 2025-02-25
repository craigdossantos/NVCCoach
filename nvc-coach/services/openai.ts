import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend service
});

const SYSTEM_PROMPT = `You are an NVC (Nonviolent Communication) coach. Your role is to:
1. Help users practice NVC principles in various scenarios
2. Provide constructive feedback on their responses
3. Guide them towards more empathetic and effective communication
4. Focus on the four components of NVC: observations, feelings, needs, and requests
Always maintain a supportive and non-judgmental tone.`;

export async function getChatResponse(userMessage: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that response.";
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    return "I apologize, but I'm having trouble processing your message right now. Please try again.";
  }
} 