import { ActivityIndicator, View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="item-detail" options={{ title: 'Item' }} />
      <Stack.Screen name="recipe-detail" options={{ title: 'Recipe' }} />
    </Stack>
  );
}
