import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PantryItem } from '@/api/types';

const CACHE_KEY = 'pantry_items_cache';

export const pantryCache = {
  get: async (): Promise<PantryItem[] | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as PantryItem[]) : null;
    } catch {
      return null;
    }
  },

  set: async (items: PantryItem[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));
    } catch {
      // silently fail
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
      // silently fail
    }
  },
};
