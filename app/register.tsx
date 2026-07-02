import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { authApi } from '@/api';
import type { ApiError } from '@/api';
import { validateRegisterForm } from '@/utils/authValidation';
import { showToastError, showToastSuccess } from '@/utils/toast';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleError = (message: string) => {
    setErrorMessage(message);
    showToastError(message);
  };

  const handleRegister = async () => {
    setErrorMessage('');

    const validationError = validateRegisterForm(name, email, password);

    if (validationError) {
      handleError(validationError);
      return;
    }

    try {
      setLoading(true);

      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      showToastSuccess('Account created! Check your email to verify before logging in.');
      router.replace('/login');
    } catch (error) {
      const apiError = error as ApiError;
      handleError(apiError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

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
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
