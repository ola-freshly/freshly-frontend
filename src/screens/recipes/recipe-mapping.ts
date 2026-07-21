import type { CreateRecipeRequest, GeneratedRecipe } from '@/api';

// Maps an AI-generated preview into the payload POST /recipes accepts.
export function previewToCreateRequest(preview: GeneratedRecipe): CreateRecipeRequest {
  return {
    title: preview.title,
    description: preview.description,
    cuisine: preview.cuisine ?? undefined,
    servings: preview.servings,
    cookTime: preview.estimatedMinutes,
    instructions: preview.instructions.join('\n'),
    calories: preview.nutrition?.calories,
    protein: preview.nutrition?.protein,
    carbs: preview.nutrition?.carbs,
    fat: preview.nutrition?.fat,
    ingredients: preview.ingredients.map((i) => ({
      ingredientName: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
  };
}
