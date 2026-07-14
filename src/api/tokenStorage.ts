import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'freshly_access_token';
const REFRESH_KEY = 'freshly_refresh_token';

function getWebItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setWebItem(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeWebItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return getWebItem(TOKEN_KEY);
    }

    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      setWebItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return getWebItem(REFRESH_KEY);
    }

    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      setWebItem(REFRESH_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },

  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      removeWebItem(TOKEN_KEY);
      removeWebItem(REFRESH_KEY);
      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
