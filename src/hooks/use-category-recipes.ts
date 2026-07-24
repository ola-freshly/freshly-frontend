import { useCallback, useEffect, useState } from 'react';

import { recipesApi } from '@/api';
import type { Recipe } from '@/api';
import type { MealCategory } from '@/components/MealTypeFilter';
import { useAsyncList } from '@/hooks/use-async-list';

// Owns the category filter + the category-filtered recipe fetch, shared by the
// Recipes list and the meal-planner "Choose a recipe" picker.
export function useCategoryRecipes(initialCategory: MealCategory = 'all') {
  const [category, setCategory] = useState<MealCategory>(initialCategory);

  const fetcher = useCallback(
    () => recipesApi.getRecipes(category === 'all' ? undefined : category),
    [category],
  );

  const { items, loading, refreshing, error, reload, refresh } = useAsyncList<Recipe>(fetcher);

  // Re-fetch (server-side filtered) whenever the category changes.
  useEffect(() => {
    reload();
  }, [category, reload]);

  return { category, setCategory, recipes: items, loading, refreshing, error, reload, refresh };
}
