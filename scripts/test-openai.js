// Test script for OpenAI API key
const { OpenAI } = require('openai');
require('dotenv').config(); // Load environment variables from .env file

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  console.log('Please set your OpenAI API key in the .env file or as an environment variable.');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API connection...');
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      model: 'gpt-3.5-turbo',
    });

    console.log('✅ OpenAI API test successful!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API test failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testOpenAI(); 