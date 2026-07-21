import { useCallback, useState } from 'react';
import { pantryApi } from '@/api/pantry';
import { pantryCache } from '@/utils/pantryCache';
import type { CreatePantryItemDto, PantryItem, UpdatePantryItemDto } from '@/api/types';

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingCached, setShowingCached] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setShowingCached(false);
      const data = await pantryApi.getAll();
      setItems(data);
      await pantryCache.set(data);
    } catch (e) {
      const cached = await pantryCache.get();
      if (cached) {
        setItems(cached);
        setShowingCached(true);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load pantry items');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const addItem = useCallback(async (dto: CreatePantryItemDto) => {
    const created = await pantryApi.create(dto);
    setItems((prev) => [created, ...prev]);
  }, []);

  const editItem = useCallback(async (id: string, dto: UpdatePantryItemDto) => {
    const updated = await pantryApi.update(id, dto);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await pantryApi.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Stable handlers so consumers can safely list reload/refresh in effect deps
  // (an inline arrow here would change identity every render and loop useFocusEffect).
  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return {
    items,
    loading,
    refreshing,
    error,
    showingCached,
    reload,
    refresh,
    addItem,
    editItem,
    deleteItem,
  };
}
