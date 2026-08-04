import { act, renderHook, waitFor } from '@testing-library/react-native';

import { recipesApi } from '@/api';
import { useCategoryRecipes } from '../use-category-recipes';

jest.mock('@/api', () => ({
  recipesApi: { getRecipes: jest.fn() },
}));

const mockedGet = recipesApi.getRecipes as jest.Mock;

const page = (ids: string[], nextCursor: string | null) => ({
  items: ids.map((id) => ({ id, title: `Recipe ${id}` })),
  nextCursor,
  hasMore: nextCursor !== null,
});

describe('useCategoryRecipes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue(page([], null));
  });

  it('omits mealType for the "all" category', async () => {
    const { result } = await renderHook(() => useCategoryRecipes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith({ mealType: undefined, cursor: null });
  });

  it('sends the mealType when started on a specific category', async () => {
    const { result } = await renderHook(() => useCategoryRecipes('dinner'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith({ mealType: 'dinner', cursor: null });
  });

  it('clears items and refetches from no cursor when the category changes', async () => {
    mockedGet.mockResolvedValueOnce(page(['breakfast-1'], 'c1'));

    const { result } = await renderHook(() => useCategoryRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    mockedGet.mockResolvedValueOnce(page(['dinner-1'], null));

    // Async act: the category change re-runs the load effect, whose fetch has
    // to settle before the assertions below.
    await act(async () => {
      result.current.setCategory('dinner');
    });

    await waitFor(() => expect(result.current.recipes.map((r) => r.id)).toEqual(['dinner-1']));

    // Breakfast rows must not survive the switch, and the new category must
    // start from the first page rather than the previous category's cursor.
    expect(mockedGet).toHaveBeenLastCalledWith({
      mealType: 'dinner',
      cursor: null,
    });
  });

  it('fetches exactly once per category change', async () => {
    const { result } = await renderHook(() => useCategoryRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.setCategory('lunch');
    });

    // A leftover reset effect alongside usePaginatedList's own would make this 3.
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('pages within the selected category using the returned cursor', async () => {
    mockedGet.mockResolvedValueOnce(page(['a'], 'c1'));

    const { result } = await renderHook(() => useCategoryRecipes('lunch'));
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    mockedGet.mockResolvedValueOnce(page(['b'], null));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockedGet).toHaveBeenLastCalledWith({
      mealType: 'lunch',
      cursor: 'c1',
    });
    expect(result.current.recipes.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('exposes retry so a failed page can be recovered', async () => {
    const { result } = await renderHook(() => useCategoryRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.retry).toBe('function');
  });
});
