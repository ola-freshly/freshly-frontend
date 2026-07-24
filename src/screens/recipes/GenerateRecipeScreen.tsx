import { router } from 'expo-router';

import { recipesApi } from '@/api';
import RecipeGeneratorForm from '@/screens/recipes/RecipeGeneratorForm';
import { previewToCreateRequest } from '@/screens/recipes/recipe-mapping';

export default function GenerateRecipeScreen() {
  return (
    <RecipeGeneratorForm
      headerTitle="AI Recipe Generator"
      subtitle="Tell us what you feel like — we'll cook something from your pantry."
      primaryLabel="Save recipe"
      primaryIcon="bookmark-outline"
      onPrimary={async (preview, mealType) => {
        const saved = await recipesApi.createRecipe({
          ...previewToCreateRequest(preview),
          mealType: mealType ?? undefined,
        });
        router.replace({ pathname: '/recipe-detail', params: { id: saved.id } });
      }}
    />
  );
}
