import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Validator from 'validatorjs';
import { toast } from 'react-toastify';

import { authApi, tokenStorage } from '@/api';
import type { ApiError } from '@/api';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);

    if (Platform.OS === 'web') {
      toast.error(message);
    }
  };

  const showSuccess = (message: string) => {
    if (Platform.OS === 'web') {
      toast.success(message);
    }
  };

  const validateForm = () => {
    const validation = new Validator(
      {
        name: name.trim(),
        email: email.trim(),
        password,
      },
      {
        name: 'required|min:2',
        email: 'required|email',
        password: 'required|min:6',
      },
      {
        'required.name': 'Full name is required.',
        'min.name': 'Full name must be at least 2 characters.',
        'required.email': 'Email is required.',
        'email.email': 'Please enter a valid email address.',
        'required.password': 'Password is required.',
        'min.password': 'Password must be at least 6 characters.',
      },
    );

    if (validation.fails()) {
      const firstError =
        validation.errors.first('name') ||
        validation.errors.first('email') ||
        validation.errors.first('password');

      showError(firstError || 'Please check your registration information.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      await tokenStorage.setAccessToken(response.accessToken);
      await tokenStorage.setRefreshToken(response.refreshToken);

      showSuccess('Account created successfully.');
      router.replace('/');
    } catch (error) {
      const apiError = error as ApiError;
      showError(apiError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Start fresh</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Freshly and organize your meals smarter.</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />

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
          <Text style={styles.buttonText}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  kicker: {
    color: '#4CAF50',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 14,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 18,
    color: '#4CAF50',
    fontWeight: '700',
  },
});
