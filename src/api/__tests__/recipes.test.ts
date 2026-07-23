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

  it('gets all recipes', async () => {
    const recipes = [
      {
        id: '1',
        title: 'Chicken Pasta',
        instructions: 'Cook and serve.',
        ingredients: ['chicken', 'pasta'],
      },
    ];

    mockedClient.get.mockResolvedValueOnce({ data: recipes });

    const result = await recipesApi.getRecipes();

    expect(mockedClient.get).toHaveBeenCalledWith('/recipes', { params: undefined });
    expect(result).toEqual(recipes);
  });

  it('filters recipes by meal type', async () => {
    const recipes = [{ id: '1', title: 'Oatmeal', instructions: 'Cook.', mealType: 'breakfast' }];

    mockedClient.get.mockResolvedValueOnce({ data: recipes });

    const result = await recipesApi.getRecipes('breakfast');

    expect(mockedClient.get).toHaveBeenCalledWith('/recipes', {
      params: { mealType: 'breakfast' },
    });
    expect(result).toEqual(recipes);
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
