import client from '../client';
import { recipesApi } from '../recipes';

jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedClient = client as jest.Mocked<typeof client>;

describe('recipesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets the first page of recipes', async () => {
    const page = {
      items: [
        {
          id: '1',
          title: 'Chicken Pasta',
          instructions: 'Cook and serve.',
        },
      ],
      nextCursor: 'cursor-1',
      hasMore: true,
    };

    mockedClient.get.mockResolvedValueOnce({ data: page });

    const result = await recipesApi.getRecipes();

    expect(mockedClient.get).toHaveBeenCalledWith('/recipes', { params: {} });
    expect(result).toEqual(page);
  });

  it('sends mealType, cursor and limit when provided', async () => {
    const page = { items: [], nextCursor: null, hasMore: false };
    mockedClient.get.mockResolvedValueOnce({ data: page });

    await recipesApi.getRecipes({ mealType: 'breakfast', cursor: 'abc', limit: 10 });

    expect(mockedClient.get).toHaveBeenCalledWith('/recipes', {
      params: { mealType: 'breakfast', cursor: 'abc', limit: 10 },
    });
  });

  it('omits a null cursor rather than sending it', async () => {
    const page = { items: [], nextCursor: null, hasMore: false };
    mockedClient.get.mockResolvedValueOnce({ data: page });

    // The hook holds nextCursor as string | null and passes it straight
    // through on the first page; serialising it would reach the backend as the
    // literal string "null" and fail cursor decoding with a 400.
    await recipesApi.getRecipes({ mealType: 'lunch', cursor: null });

    expect(mockedClient.get).toHaveBeenCalledWith('/recipes', {
      params: { mealType: 'lunch' },
    });
  });

  it('creates a recipe', async () => {
    const payload = {
      title: 'Chicken Pasta',
      description: 'Weeknight favourite.',
      instructions: '1. Cook pasta.\n2. Add chicken and serve.',
      servings: 2,
      cookTime: 30,
      ingredients: [
        { ingredientName: 'chicken', quantity: 200, unit: 'g' },
        { ingredientName: 'pasta' },
      ],
    };

    const createdRecipe = {
      id: '1',
      ...payload,
    };

    mockedClient.post.mockResolvedValueOnce({ data: createdRecipe });

    const result = await recipesApi.createRecipe(payload);

    expect(mockedClient.post).toHaveBeenCalledWith('/recipes', payload);
    expect(result).toEqual(createdRecipe);
  });

  it('generates a recipe', async () => {
    const payload = {
      mealType: 'dinner',
      cuisine: 'Asian',
      servings: 2,
      notes: 'make it spicy',
    };

    const generatedRecipe = {
      title: 'Egg Fried Rice',
      description: 'Quick fried rice.',
      cuisine: 'Asian',
      servings: 2,
      estimatedMinutes: 20,
      ingredients: [{ name: 'rice', quantity: 200, unit: 'g' }],
      instructions: ['Cook the rice', 'Fry everything'],
      nutrition: { calories: 500, protein: 20, carbs: 60, fat: 15 },
      missingIngredients: [],
    };

    mockedClient.post.mockResolvedValueOnce({ data: generatedRecipe });

    const result = await recipesApi.generateRecipe(payload);

    expect(mockedClient.post).toHaveBeenCalledWith('/recipes/generate', payload, {
      timeout: 45_000,
    });
    expect(result).toEqual(generatedRecipe);
  });
});
