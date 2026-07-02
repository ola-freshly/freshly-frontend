import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useEffect } from 'react';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { tokenStorage } from '@/api/tokenStorage';

export default function RootLayout() {
  useEffect(() => {
    tokenStorage.getAccessToken().then((token) => {
      if (!token) {
        router.replace('/welcome');
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="index" options={{ headerShown: true, title: 'Home' }} />
          <Stack.Screen name="profile-setup" options={{ headerShown: true }} />
        </Stack>
        {Platform.OS === 'web' ? <ToastContainer position="top-right" /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
