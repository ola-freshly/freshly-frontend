import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { mealPlansApi } from '@/api';
import type { Recipe } from '@/api';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBar } from '@/components/ErrorBar';
import { MealTypeFilter } from '@/components/MealTypeFilter';
import { tapLight } from '@/utils/haptics';

import { ensureMealPlan } from './ensureMealPlan';
import { plannerStore } from './store';
import { ACCENT, ACCENT_LIGHT, MealType } from './theme';
import { useCategoryRecipes } from '@/hooks/use-category-recipes';

export default function PickRecipeScreen() {
  const { mealType, date } = useLocalSearchParams<{ mealType?: string; date?: string }>();

  const slot = mealType as MealType | undefined;
  const [search, setSearch] = useState('');
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const {
    category,
    setCategory,
    recipes,
    loading,
    error: loadError,
    reload,
  } = useCategoryRecipes(slot ?? 'all');

  const error = attachError ?? loadError;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.title.toLowerCase().includes(q));
  }, [recipes, search]);

  const attach = async (recipe: Recipe) => {
    if (!slot || !date || attachingId) return;
    tapLight();
    try {
      setAttachError(null);
      setAttachingId(recipe.id);
      const mealPlanId = await ensureMealPlan(date);
      const item = await mealPlansApi.attachRecipe({
        mealPlanId,
        recipeId: recipe.id,
        mealDate: date,
        mealType: slot,
      });

      plannerStore.add(date, slot, {
        id: item.id,
        recipeId: recipe.id,
        title: recipe.title,
        cookTime: Number(recipe.cookTime ?? 0),
        calories: Number(recipe.calories ?? 0),
      });

      // Close the picker + chooser screens, back to the planner.
      router.dismissAll();
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : 'Could not add that recipe.');
      setAttachingId(null);
    }
  };

  if (!slot || !date) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Missing meal date or meal type.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Choose a recipe' }} />

      <MealTypeFilter value={category} onChange={setCategory} />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {error ? <ErrorBar message={error} onRetry={reload} /> : null}

      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={visible.length === 0 ? styles.emptyWrap : styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              disabled={!!attachingId}
              onPress={() => attach(item)}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="restaurant-outline" size={22} color={ACCENT} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>
                  {item.cookTime ?? 0} min • {Math.round(Number(item.calories ?? 0))} kcal
                </Text>
              </View>
              {attachingId === item.id ? (
                <ActivityIndicator color={ACCENT} />
              ) : (
                <Ionicons name="add-circle" size={24} color={ACCENT} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !error ? (
              <EmptyState
                icon="restaurant-outline"
                title="No recipes here yet"
                subtitle={
                  category === 'all'
                    ? 'Create or generate a recipe to add it to your plan.'
                    : `No ${category} recipes yet — try another category or generate one.`
                }
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mutedText: { color: '#6B7280' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },

  listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6B7280', fontSize: 13 },
});
