import { useCallback, useEffect, useState } from 'react';
import { pantryApi } from '@/api/pantry';
import type { PantryItem } from '@/api/types';

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await pantryApi.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {load();},[load]);
  return { items, loading, error,reload:load };
}