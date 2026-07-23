import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { apiClient } from '@/api';

export default function HomeScreen() {
  const [status, setStatus] = useState<string>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await apiClient.get<string>('/');
        setStatus(`Connected: ${res.data}`);
      } catch (err: any) {
        setStatus(`Failed: ${err.message}`);
      }
    };

    checkConnection();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{status}</Text>
      {/* DEV: preview profile setup screen */}
      <Link href="/(app)/profile-setup" style={{ marginTop: 24, color: '#16A34A', fontSize: 15 }}>
        Go to Profile Setup →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
