import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { setupGoogleAuth } from '../services/googleAuth';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  useEffect(() => {
    // Inicializa a configuração do Google uma única vez
    setupGoogleAuth();
  }, []);

  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </PaperProvider>

  );
}