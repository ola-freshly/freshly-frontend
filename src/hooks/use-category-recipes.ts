import { useCallback, useEffect, useState } from 'react';

import { recipesApi } from '@/api';
import type { Recipe } from '@/api';
import type { MealCategory } from '@/components/MealTypeFilter';
import { useAsyncList } from '@/hooks/use-async-list';
import { usePaginatedList } from '@/hooks/use-paginated-list';

// Owns the category filter + the category-filtered recipe fetch, shared by the
// Recipes list and the meal-planner "Choose a recipe" picker.
export function useCategoryRecipes(initialCategory: MealCategory = 'all') {
  const [category, setCategory] = useState<MealCategory>(initialCategory);

  const fetcher = useCallback(
    (cursor: string | null) =>
      recipesApi.getRecipes({
        mealType: category === 'all' ? undefined : category,
        cursor,
      }),
    [category],
  );

  const list = usePaginatedList<Recipe>(fetcher);

  return { category, setCategory, recipes: list.items,...list };
}
