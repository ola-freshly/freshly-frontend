import { useCallback } from 'react';
import { pantryApi } from '@/api/pantry';
import { pantryCache } from '@/utils/pantryCache';
import type { CreatePantryItemDto, PantryItem, UpdatePantryItemDto } from '@/api/types';
import { useAsyncList } from '@/hooks/use-async-list';

// Pantry-list state: the shared async-list machine plus offline cache recovery
// and optimistic add/edit/delete mutations.
export function usePantry() {
  const { items, setItems, loading, refreshing, error, stale, reload, refresh } =
    useAsyncList<PantryItem>(pantryApi.getAll, {
      onSuccess: (data) => {
        void pantryCache.set(data);
      },
      recover: () => pantryCache.get(),
    });

  const addItem = useCallback(
    async (dto: CreatePantryItemDto) => {
      const created = await pantryApi.create(dto);
      setItems((prev) => [created, ...prev]);
    },
    [setItems],
  );

  const editItem = useCallback(
    async (id: string, dto: UpdatePantryItemDto) => {
      const updated = await pantryApi.update(id, dto);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    },
    [setItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await pantryApi.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems],
  );

  const mergeItems = useCallback(
    async (payload: {
      itemIds: string[];
      primaryId: string;
      name?: string;
      expiryDate?: string | null;
    }) => {
      const merged = await pantryApi.merge(payload);
      // Replace the primary in place and drop the merged-away rows.
      setItems((prev) =>
        prev
          .map((i) => (i.id === merged.id ? merged : i))
          .filter((i) => i.id === merged.id || !payload.itemIds.includes(i.id)),
      );
    },
    [setItems],
  );

  return {
    items,
    loading,
    refreshing,
    error,
    showingCached: stale,
    reload,
    refresh,
    addItem,
    editItem,
    deleteItem,
    mergeItems,
  };
}
