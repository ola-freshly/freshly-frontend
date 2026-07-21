import { recipesApi } from '@/api';
import { useAsyncList } from '@/hooks/use-async-list';

// Recipe-list state, built on the shared async-list state machine.
export function useRecipes() {
  const { items, loading, refreshing, error, reload, refresh } = useAsyncList(
    recipesApi.getRecipes,
  );
  return { recipes: items, loading, refreshing, error, reload, refresh };
}
