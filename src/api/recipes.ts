import client from './client';
import type { CreateRecipeRequest, GenerateRecipeRequest, GeneratedRecipe, Recipe } from './types';

export const recipesApi = {
  async getRecipes(): Promise<Recipe[]> {
    const { data } = await client.get<Recipe[]>('/recipes');
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

  async generateRecipe(payload: GenerateRecipeRequest): Promise<GeneratedRecipe> {
    const { data } = await client.post<GeneratedRecipe>('/recipes/generate', payload);
    return data;
  },
};
