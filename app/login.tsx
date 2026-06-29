import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { authApi, tokenStorage } from '@/api';
import type { ApiError } from '@/api';
import { validateLoginForm } from '@/utils/authValidation';
import { showToastError, showToastSuccess } from '@/utils/toast';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleError = (message: string) => {
    setErrorMessage(message);
    showToastError(message);
  };

  const handleLogin = async () => {
    setErrorMessage('');

    const validationError = validateLoginForm(email, password);

    if (validationError) {
      handleError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      await tokenStorage.setAccessToken(response.accessToken);
      await tokenStorage.setRefreshToken(response.refreshToken);

      showToastSuccess('Login successful.');
      router.replace('/');
    } catch (error) {
      const apiError = error as ApiError;
      handleError(apiError.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.button, loading && styles.disabledButton]}
        disabled={loading}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/register')}>
        <Text style={styles.linkText}>Do not have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
