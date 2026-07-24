import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { mealPlansApi, recipesApi } from '@/api';
import RecipeGeneratorForm from '@/screens/recipes/RecipeGeneratorForm';
import { previewToCreateRequest } from '@/screens/recipes/recipe-mapping';

import { ensureMealPlan } from './ensureMealPlan';
import { plannerStore } from './store';
import { MealType } from './theme';

// "Generate with AI" branch of the planner add flow. Reuses the recipes-page
// generator (form + refine + preview), but the meal type is locked to the slot
// the user tapped and the result is attached to the plan instead of the library.
export default function MealPlanGenerateScreen() {
  const { mealType, date } = useLocalSearchParams<{ mealType?: string; date?: string }>();

  if (!mealType || !date) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#6B7280' }}>Missing meal date or meal type.</Text>
      </View>
    );
  }

  const slot = mealType as MealType;

  return (
    <RecipeGeneratorForm
      headerTitle="Generate a meal"
      subtitle="Tell us what you feel like — we'll cook something from your pantry and add it to your plan."
      lockedMealType={slot}
      primaryLabel="Add to plan"
      primaryIcon="add"
      onPrimary={async (preview) => {
        const mealPlanId = await ensureMealPlan(date);

        // Persist as a plan-only recipe so it stays out of the recipe library.
        const saved = await recipesApi.createRecipe({
          ...previewToCreateRequest(preview),
          mealType: slot,
          source: 'plan',
        });

        const item = await mealPlansApi.attachRecipe({
          mealPlanId,
          recipeId: saved.id,
          mealDate: date,
          mealType: slot,
        });

        plannerStore.add(date, slot, {
          id: item.id,
          recipeId: saved.id,
          title: saved.title,
          cookTime: Number(saved.cookTime ?? 0),
          calories: Number(saved.calories ?? 0),
        });

        // Close the generate + chooser screens, back to the planner.
        router.dismissAll();
      }}
    />
  );
}
