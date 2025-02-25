import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Provider as PaperProvider, TextInput, Button, Surface, Text, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import { useState, useRef, useEffect } from 'react';
import { getChatResponse } from './services/openai';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your NVC coach. Let's practice some nonviolent communication. Would you like to start with a scenario?",
      sender: 'bot'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot'
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PaperProvider theme={MD3LightTheme}>
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <Text variant="headlineMedium">NVC Coach</Text>
        </Surface>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messageList} 
          contentContainerStyle={styles.messageListContent}
        >
          {messages.map((message) => (
            <Surface
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.botMessage
              ]}
              elevation={1}
            >
              <Text style={message.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
                {message.text}
              </Text>
            </Surface>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator animating={true} color={MD3LightTheme.colors.primary} />
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            multiline
            disabled={isLoading}
          />
          <Button 
            mode="contained" 
            onPress={handleSend}
            style={styles.sendButton}
            disabled={isLoading || !inputText.trim()}
          >
            Send
          </Button>
        </KeyboardAvoidingView>
        <StatusBar style="auto" />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    justifyContent: 'center',
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#000',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});
