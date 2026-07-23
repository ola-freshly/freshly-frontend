import { ActivityIndicator, View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import OfflineBanner from '@/components/OfflineBanner';

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
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item-detail" options={{ title: 'Item Detail' }} />
        <Stack.Screen name="add-item" options={{ title: 'Add Item' }} />
        <Stack.Screen name="scan-barcode" options={{ title: 'Scan Barcode' }} />
        <Stack.Screen name="scan-image" options={{ title: 'Identify Food' }} />
        <Stack.Screen name="recipe-detail" options={{ title: 'Recipe' }} />
        <Stack.Screen name="meal-detail" options={{ title: 'Meal' }} />
        <Stack.Screen
          name="meal-suggestion"
          options={{ presentation: 'modal', title: 'Add a meal' }}
        />
        <Stack.Screen name="pick-recipe" options={{ title: 'Choose a recipe' }} />
        <Stack.Screen name="meal-plan-generate" options={{ title: 'Generate a meal' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: true }} />
      </Stack>
    </View>
  );
}
