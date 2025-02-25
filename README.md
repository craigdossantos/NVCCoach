# NVC Coach

A chat application that helps users practice Nonviolent Communication (NVC) principles through interactive scenarios and feedback.

## Features

- Chat interface with an AI coach trained in NVC principles
- Voice recording and transcription for hands-free interaction
- Real-time streaming responses
- Mobile-friendly design

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   Note: Never commit your actual API key to version control.

4. Start the development server:
   ```
   npm run web
   ```

## Environment Variables

This project uses environment variables to manage sensitive information like API keys. To set up your environment:

1. Copy `.env.example` to a new file called `.env`
2. Replace the placeholder values with your actual API keys
3. Make sure `.env` is in your `.gitignore` file to prevent accidentally committing secrets

## Technologies Used

- React Native / Expo
- React Native Paper for UI components
- OpenAI API for chat responses
- Whisper API for voice transcription

## License

MIT
