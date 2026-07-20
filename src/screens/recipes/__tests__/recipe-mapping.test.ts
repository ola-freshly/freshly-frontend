import type { GeneratedRecipe } from '@/api';
import { previewToCreateRequest } from '../recipe-mapping';

const preview: GeneratedRecipe = {
  title: 'Egg Fried Rice',
  description: 'Quick fried rice.',
  cuisine: 'Asian',
  servings: 2,
  estimatedMinutes: 20,
  ingredients: [
    { name: 'rice', quantity: 200, unit: 'g' },
    { name: 'egg', quantity: 2, unit: 'pcs' },
  ],
  instructions: ['Cook the rice', 'Fry everything'],
  nutrition: { calories: 500, protein: 20, carbs: 60, fat: 15 },
  missingIngredients: [],
};

describe('previewToCreateRequest', () => {
  it('maps title, cuisine, servings and cookTime', () => {
    const result = previewToCreateRequest(preview);
    expect(result.title).toBe('Egg Fried Rice');
    expect(result.cuisine).toBe('Asian');
    expect(result.servings).toBe(2);
    expect(result.cookTime).toBe(20);
  });

  it('joins instructions with newlines', () => {
    expect(previewToCreateRequest(preview).instructions).toBe('Cook the rice\nFry everything');
  });

  it('copies nutrition fields', () => {
    expect(previewToCreateRequest(preview)).toMatchObject({
      calories: 500,
      protein: 20,
      carbs: 60,
      fat: 15,
    });
  });

  it('maps ingredients into ingredientName shape', () => {
    expect(previewToCreateRequest(preview).ingredients).toEqual([
      { ingredientName: 'rice', quantity: 200, unit: 'g' },
      { ingredientName: 'egg', quantity: 2, unit: 'pcs' },
    ]);
  });

  it('converts null cuisine to undefined', () => {
    expect(previewToCreateRequest({ ...preview, cuisine: null }).cuisine).toBeUndefined();
  });
});
