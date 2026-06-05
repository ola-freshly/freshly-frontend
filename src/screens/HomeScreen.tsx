import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api';
import { ENV } from '@/config/env';

export default function HomeScreen() {
  const [status, setStatus] = useState<String>('checking');

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
