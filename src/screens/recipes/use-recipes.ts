import { useCallback, useState } from 'react';

import { recipesApi, type Recipe } from '@/api';

// Owns the recipe-list async state (loading / refreshing / error) and exposes
// stable reload/refresh handlers. Mirrors the pantry screen's use-pantry hook so
// both screens share the same loading/error/empty format.
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await recipesApi.getRecipes();
      setRecipes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { recipes, loading, refreshing, error, reload, refresh };
}
