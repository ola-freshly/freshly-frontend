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

    expect(mockedClient.get).toHaveBeenCalledWith('/recipes');
    expect(result).toEqual(recipes);
  });

  it('creates a recipe', async () => {
    const payload = {
      title: 'Chicken Pasta',
      instructions: 'Cook and serve.',
      ingredients: ['chicken', 'pasta'],
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
      pantryItems: ['rice', 'egg'],
      preferences: 'Asian',
    };

    const generatedRecipe = {
      title: 'Egg Fried Rice',
      ingredients: ['rice', 'egg'],
      instructions: 'Stir-fry all ingredients.',
      estimatedTime: 20,
      servings: 2,
    };

    mockedClient.post.mockResolvedValueOnce({ data: generatedRecipe });

    const result = await recipesApi.generateRecipe(payload);

    expect(mockedClient.post).toHaveBeenCalledWith('/recipes/generate', payload);
    expect(result).toEqual(generatedRecipe);
  });
});

