import client from './client';
import type {
  CreateRecipeRequest,
  GenerateRecipeRequest,
  GeneratedRecipe,
  Recipe,
  GetRecipesParams,
  Paginated,
} from './types';

export const recipesApi = {
  async getRecipes(params: GetRecipesParams = {}): Promise<Paginated<Recipe>> {
    const query: Record<string, string | number> = {};
    if (params.mealType) query.mealType = params.mealType;
    if (params.q) query.q = params.q;
    if (params.cursor) query.cursor = params.cursor;
    if (params.limit !== undefined) query.limit = params.limit;

    const { data } = await client.get<Paginated<Recipe>>('/recipes', { params: query });
    return data;
  },

  async getRecipeById(id: string): Promise<Recipe> {
    const { data } = await client.get<Recipe>(`/recipes/${id}`);
    return data;
  },

  async createRecipe(payload: CreateRecipeRequest): Promise<Recipe> {
    const { data } = await client.post<Recipe>('/recipes', payload);
    return data;
  },

  async deleteRecipe(id: string): Promise<void> {
    await client.delete(`/recipes/${id}`);
  },

  async generateRecipe(payload: GenerateRecipeRequest): Promise<GeneratedRecipe> {
    // AI generation runs longer than the client's 10s default; give it room.
    const { data } = await client.post<GeneratedRecipe>('/recipes/generate', payload, {
      timeout: 45_000,
    });
    return data;
  },
};
