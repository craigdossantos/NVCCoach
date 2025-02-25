import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { openai } from './openai';
import { Platform } from 'react-native';
import { OPENAI_API_KEY } from '../config';

// Add MediaStream types
type MediaStreamTrack = {
  stop: () => void;
};

async function getMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not supported in this browser');
  }

  const mimeTypes = [
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav'
  ];
  
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Supported MIME type:', type);
      return type;
    }
  }
  console.log('Falling back to audio/webm');
  return 'audio/webm';
}

async function startRecording() {
  try {
    console.log('Requesting permissions..');
    
    if (Platform.OS === 'web') {
      console.log('Starting web recording flow');
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Got media stream');
      const mimeType = await getMimeType();
      console.log('Using MIME type:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const audioChunks: Blob[] = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        console.log('Data available event, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });

      mediaRecorder.start();
      console.log('Recording started on web');
      return { mediaRecorder, audioChunks, stream };
    } else {
      console.log('Starting native recording flow');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      console.log('Native recording started');
      return { recording };
    }
  } catch (err) {
    console.error('Failed to start recording:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to start recording');
  }
}

async function stopRecording(recordingData: any) {
  try {
    console.log('Stopping recording..');
    
    if (Platform.OS === 'web') {
      console.log('Stopping web recording');
      const { mediaRecorder, audioChunks, stream } = recordingData;
      
      return new Promise<string>((resolve, reject) => {
        mediaRecorder.addEventListener('stop', async () => {
          try {
            console.log('MediaRecorder stopped');
            // Stop all tracks
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            console.log('Stream tracks stopped');
            
            // Create blob from chunks
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            console.log('Created audio blob, size:', audioBlob.size);
            
            // Create FormData
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model', 'whisper-1');

            console.log('Sending to Whisper API..');
            console.log('API Key available:', !!OPENAI_API_KEY);
            console.log('API Key length:', OPENAI_API_KEY?.length);
            
            try {
              const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: formData,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('Transcription API error:', response.status, errorText);
                throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
              }

              const result = await response.json();
              console.log('Transcription completed:', result);
              resolve(result.text);
            } catch (error) {
              console.error('Fetch error:', error);
              reject(error);
            }
          } catch (error) {
            console.error('Transcription error:', error);
            reject(error);
          }
        });

        mediaRecorder.stop();
      });
    } else {
      console.log('Stopping native recording');
      const { recording } = recordingData;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI available');
      
      const audioFile = await FileSystem.getInfoAsync(uri);
      if (!audioFile.exists) throw new Error('Audio file does not exist');
      console.log('Audio file info:', audioFile);

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      } as any);
      formData.append('model', 'whisper-1');

      console.log('Sending to Whisper API..');
      console.log('API Key available:', !!OPENAI_API_KEY);
      console.log('API Key length:', OPENAI_API_KEY?.length);
      
      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Transcription API error:', response.status, errorText);
          throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Transcription completed:', result);
        await FileSystem.deleteAsync(uri);
        return result.text;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    }
  } catch (err) {
    console.error('Failed to stop recording or transcribe:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to transcribe audio');
  }
}

const audioService = {
  startRecording,
  stopRecording
};

export { startRecording, stopRecording };
export default audioService; 