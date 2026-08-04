import { useCallback, useState } from 'react';

import { recipesApi } from '@/api';
import type { Recipe } from '@/api';
import type { MealCategory } from '@/components/MealTypeFilter';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePaginatedList } from '@/hooks/use-paginated-list';

// Owns the category filter, the optional title search, and the cursor-paginated
// recipe fetch — shared by the Recipes list and the meal-planner "Choose a
// recipe" picker.
//
// There is deliberately no reset effect here: rebuilding `fetcher` when the
// category or search changes alters its identity, which is what makes
// usePaginatedList clear the loaded pages and refetch from no cursor. A second
// effect would double-fetch.
//
// `search` is filtered server-side. Doing it client-side would only ever match
// the pages already downloaded, which both hides real results and starves
// onEndReached when the filtered list is too short to scroll.
export function useCategoryRecipes(initialCategory: MealCategory = 'all', search = '') {
  const [category, setCategory] = useState<MealCategory>(initialCategory);

  // Debounced so typing doesn't change the fetcher identity on every keystroke,
  // which would reset and refetch the list per character.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const fetcher = useCallback(
    (cursor: string | null) =>
      recipesApi.getRecipes({
        mealType: category === 'all' ? undefined : category,
        q: debouncedSearch || undefined,
        cursor,
      }),
    [category, debouncedSearch],
  );

  const list = usePaginatedList<Recipe>(fetcher);

  return { category, setCategory, recipes: list.items, ...list };
}
