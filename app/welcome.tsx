import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.logo}>🥗 Freshly</Text>
        <Text style={styles.title}>Cook smarter with what you already have.</Text>
        <Text style={styles.subtitle}>
          Track pantry items, discover recipe ideas, and reduce food waste with Freshly.
        </Text>

        <Pressable style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F5F7F2',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 16,
    color: '#1F1F1F',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 36,
    color: '#666',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#EEF7EE',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '700',
  },
});
