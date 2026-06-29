import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin() {
    //replace with real API call
    await login('mock-access-token', 'mock-refresh-token');
    router.replace('/(app)/(tabs)/pantry');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Freshly</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Create an account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    color: '#208AEF',
    fontSize: 14,
  },
});
