import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

export default function Layout() {
  return (
    <PaperProvider theme={MD3LightTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#f5f5f5',
          }
        }}
      />
    </PaperProvider>
  );
}
