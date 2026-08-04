import { useCallback, useState } from 'react';

import { recipesApi } from '@/api';
import type { Recipe } from '@/api';
import type { MealCategory } from '@/components/MealTypeFilter';
import { usePaginatedList } from '@/hooks/use-paginated-list';

// Owns the category filter + the category-filtered, cursor-paginated recipe
// fetch, shared by the Recipes list and the meal-planner "Choose a recipe"
// picker.
//
// There is deliberately no reset effect here: rebuilding `fetcher` per category
// changes its identity, which is what makes usePaginatedList clear the loaded
// pages and refetch from no cursor. A second effect would double-fetch.
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

  return { category, setCategory, recipes: list.items, ...list };
}
