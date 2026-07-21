import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { DailyRecommendation, MealRecommendationRecipe, mealPlansApi } from '@/api/mealPlans';

import { plannerStore } from './store';
import { ACCENT, MealType } from './theme';

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }
  }

  return 'Please check your connection and try again.';
}

function getFirstRecipe(
  response: DailyRecommendation,
  mealType: string,
): MealRecommendationRecipe | null {
  const matchingMeal = response.meals.find(
    (meal) => meal.mealType.toLowerCase() === mealType.toLowerCase(),
  );

  return matchingMeal?.recipes?.[0] ?? response.meals?.[0]?.recipes?.[0] ?? null;
}

export default function MealSuggestionModal() {
  const { mealType, date } = useLocalSearchParams<{
    mealType?: string;
    date?: string;
  }>();

  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [suggestion, setSuggestion] = useState<MealRecommendationRecipe | null>(null);

  const [excludedTitles, setExcludedTitles] = useState<string[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  const loadSuggestion = async () => {
    if (!date || !mealType) {
      setError('Missing meal date or meal type.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await mealPlansApi.daily({
        mealDate: date,
        mealTypes: [mealType],
        dishesPerMeal: 1,
      });

      const recipe = getFirstRecipe(response, mealType);

      if (!recipe) {
        throw new Error('No meal suggestion was returned.');
      }

      setSuggestion(recipe);
      setExcludedTitles([]);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadSuggestion();
    }, 0);

    return () => {
      clearTimeout(loadTimer);

      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, mealType]);

  const ensureMealPlan = async (mealDate: string): Promise<string> => {
    const plans = await mealPlansApi.list();

    const existingPlan = plans.find((plan) => {
      const startDate = String(plan.startDate).slice(0, 10);
      const endDate = String(plan.endDate).slice(0, 10);

      return startDate <= mealDate && mealDate <= endDate;
    });

    if (existingPlan) {
      return existingPlan.id;
    }

    const newPlan = await mealPlansApi.create({
      name: `Meal Plan ${mealDate}`,
      startDate: mealDate,
      endDate: mealDate,
    });

    return newPlan.id;
  };

  const generateAnother = async () => {
    if (!date || !mealType || !suggestion || refreshing || saving) {
      return;
    }

    const nextExcludedTitles = Array.from(new Set([...excludedTitles, suggestion.title]));

    setRefreshing(true);
    setError(null);

    try {
      const response = await mealPlansApi.refresh({
        mealDate: date,
        mealType,
        dishesPerMeal: 1,
        excludeTitles: nextExcludedTitles,
      });

      const nextSuggestion = response.recipes[0];

      if (!nextSuggestion) {
        throw new Error('No new meal suggestion was returned.');
      }

      setExcludedTitles(nextExcludedTitles);
      setSuggestion(nextSuggestion);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setRefreshing(false);
    }
  };

  const addDish = async () => {
    if (!date || !mealType || !suggestion || saving || refreshing) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const mealPlanId = await ensureMealPlan(date);

      const response = await mealPlansApi.accept({
        mealPlanId,
        suggestions: [
          {
            mealDate: date,
            mealType,
            recipe: suggestion,
          },
        ],
      });

      if (response.acceptedCount === 0) {
        showToast(`“${suggestion.title}” is already in this meal.`);
        return;
      }

      const acceptedItem = response.items[0];

      plannerStore.add(date, mealType as MealType, {
        id: acceptedItem?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: suggestion.title,
        cookTime: Number(suggestion.estimatedMinutes ?? 0),
        calories: Number(suggestion.nutrition?.calories ?? 0),
      });

      setAddedCount((current) => current + 1);
      showToast(`Added “${suggestion.title}” to ${mealType}.`);

      const nextExcludedTitles = Array.from(new Set([...excludedTitles, suggestion.title]));

      setExcludedTitles(nextExcludedTitles);

      try {
        const nextResponse = await mealPlansApi.refresh({
          mealDate: date,
          mealType,
          dishesPerMeal: 1,
          excludeTitles: nextExcludedTitles,
        });

        if (nextResponse.recipes[0]) {
          setSuggestion(nextResponse.recipes[0]);
        }
      } catch {
        // Saving succeeded even if generating the next card fails.
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || refreshing || saving;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Suggested {mealType ?? 'meal'}</Text>

      <View style={styles.subtitleRow}>
        <Ionicons name="sparkles" size={13} color={ACCENT} />
        <Text style={styles.subtitle}>Generated from your pantry ingredients</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {toast && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && !suggestion ? (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.placeholderText}>Creating your suggestion…</Text>
          </View>
        ) : suggestion ? (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.thumbnail}>
                {refreshing ? (
                  <ActivityIndicator color={ACCENT} />
                ) : (
                  <Ionicons name="restaurant-outline" size={26} color={ACCENT} />
                )}
              </View>

              <View style={styles.cardHeading}>
                <Text style={styles.title}>{suggestion.title}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color="#888" />
                  <Text style={styles.meta}>{Number(suggestion.estimatedMinutes ?? 0)} min</Text>

                  <Text style={styles.metaDot}>·</Text>

                  <Ionicons name="flame-outline" size={13} color="#888" />
                  <Text style={styles.meta}>
                    {Number(suggestion.nutrition?.calories ?? 0)} kcal
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.description}>
              {suggestion.description ?? 'A personalized meal suggestion.'}
            </Text>

            {!!suggestion.missingIngredients?.length && (
              <Text style={styles.missing}>
                Missing:{' '}
                {suggestion.missingIngredients.map((ingredient) => ingredient.name).join(', ')}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No suggestion available.</Text>

            <Pressable style={styles.retryButton} onPress={() => void loadSuggestion()}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={[styles.secondary, busy && styles.disabled]}
          disabled={busy || !suggestion}
          onPress={() => void generateAnother()}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#333" />
          ) : (
            <Ionicons name="shuffle" size={18} color="#333" />
          )}

          <Text style={styles.secondaryText}>
            {refreshing ? 'Generating…' : 'Generate another'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy || !suggestion}
          onPress={() => void addDish()}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              Add dish
              {addedCount > 0 ? `  ·  ${addedCount} added` : ''}
            </Text>
          )}
        </Pressable>

        <Pressable disabled={saving} onPress={() => router.back()}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textTransform: 'capitalize',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subtitle: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
  },
  content: {
    gap: 12,
    paddingVertical: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ACCENT + '14',
    borderRadius: 12,
    padding: 12,
  },
  toastText: {
    flex: 1,
    color: ACCENT,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
  },
  placeholder: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeading: {
    flex: 1,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: ACCENT + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  meta: {
    color: '#888',
    fontSize: 13,
  },
  metaDot: {
    color: '#CCC',
    fontSize: 13,
  },
  description: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
  },
  missing: {
    color: '#9A6700',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
  secondary: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 13,
  },
  secondaryText: {
    color: '#333',
    fontWeight: '600',
  },
  primary: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderRadius: 12,
    padding: 15,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.55,
  },
  done: {
    paddingVertical: 10,
    textAlign: 'center',
    color: '#555',
    fontWeight: '600',
  },
});
