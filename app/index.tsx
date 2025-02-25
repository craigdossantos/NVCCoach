import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Surface, Text, ActivityIndicator, MD3LightTheme, Appbar, IconButton } from 'react-native-paper';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { getChatResponse } from './services/openai';
import { Audio } from 'expo-av';
import { startRecording, stopRecording } from './services/audio';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your NVC coach. Let's practice some nonviolent communication. Would you like to start with a scenario?",
      sender: 'bot'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, streamingMessage?.text]);

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

    const tempMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "",
      sender: 'bot'
    };
    setStreamingMessage(tempMessage);

    try {
      let finalResponse = '';
      await getChatResponse(inputText, (partialResponse) => {
        finalResponse = partialResponse;
        setStreamingMessage(prev => prev ? { ...prev, text: partialResponse } : null);
      });
      
      // After streaming is complete, add the final message to the list
      setMessages(prev => [...prev, { ...tempMessage, text: finalResponse }]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setStreamingMessage(null);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        if (!recording) return;
        setInputText("Transcribing..."); // Show transcribing state
        const transcribedText = await stopRecording(recording);
        console.log('Transcribed text:', transcribedText); // Debug log
        
        if (!transcribedText) {
          throw new Error("No transcription received");
        }
        
        // Update the input text with transcribed text
        setInputText(transcribedText);
        setRecording(null);
        
        // Don't automatically send - let user review and edit if needed
      } catch (error) {
        console.error('Error stopping recording:', error);
        setInputText(""); // Clear the input text on error
        alert(error instanceof Error ? error.message : "Failed to transcribe audio. Please try again.");
      }
    } else {
      try {
        const newRecording = await startRecording();
        if (!newRecording) {
          throw new Error("Failed to start recording");
        }
        setRecording(newRecording);
        setIsRecording(true);
        setInputText("Recording... (tap microphone again to stop)");
      } catch (error: any) {
        console.error('Error starting recording:', error);
        setInputText(""); // Clear the input text on error
        alert(error.message || "Failed to start recording. Please check microphone permissions.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="NVC Coach" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.mainContent}>
        <View style={styles.chatContainer}>
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
            {streamingMessage && (
              <Surface
                style={[styles.messageBubble, styles.botMessage]}
                elevation={1}
              >
                <Text style={styles.botMessageText}>
                  {streamingMessage.text}
                </Text>
              </Surface>
            )}
            {isLoading && !streamingMessage && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} color={MD3LightTheme.colors.primary} />
              </View>
            )}
          </ScrollView>

          <Surface style={styles.inputWrapper} elevation={4}>
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
                disabled={isLoading || isRecording}
                onKeyPress={handleKeyPress}
              />
              <View style={styles.buttonContainer}>
                <IconButton
                  icon={isRecording ? "stop-circle" : "microphone"}
                  mode="contained"
                  onPress={handleVoiceRecord}
                  style={[styles.voiceButton, isRecording && styles.recordingButton]}
                  size={24}
                  disabled={isLoading}
                />
                <Button 
                  mode="contained" 
                  onPress={handleSend}
                  style={styles.sendButton}
                  disabled={isLoading || !inputText.trim() || isRecording}
                >
                  Send
                </Button>
              </View>
            </KeyboardAvoidingView>
          </Surface>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  messageList: {
    flex: 1,
    paddingBottom: 100, // Space for input container
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 32,
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
    padding: 8,
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
    maxHeight: 100,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    marginRight: 8,
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  sendButton: {
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  botMessageText: {
    color: '#000',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
}); 