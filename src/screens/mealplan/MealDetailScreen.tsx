import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, DANGER, MealType, MEALS } from './theme';
import { plannerStore } from './store';
import { mealPlansApi, Recipe, recipesApi } from '@/api';
import { ErrorBar } from '@/components/ErrorBar';

type Tab = 'ingredients' | 'instructions' | 'nutrition';

// Scale the leading number in a value string ("150 g", "2 stalks", "26%") by a
// factor, keeping the unit. Non-numeric strings pass through untouched.
function scaleAmount(amount: string, factor: number): string {
  return amount.replace(/^\s*(\d+(?:\.\d+)?)/, (_, n) => {
    const scaled = parseFloat(n) * factor;
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  });
}

export default function MealDetailScreen() {
  const router = useRouter();
  const { id, recipeId, date, mealType } = useLocalSearchParams<{
    id?: string;
    recipeId?: string;
    date?: string;
    mealType?: string;
  }>();
  const [recipe,setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load=useCallback(async () => {
    if(!recipeId){
      setError("Missing recipeId");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try{
      const data=await recipesApi.getRecipeById(recipeId);
      setRecipe(data);
      setServings(data.servings??1)
    }catch(e){
      setError(e instanceof Error?e.message: "Failed to fetch recipes");
    }finally {
      setLoading(false);
    }
  },[recipeId]);
  
  useEffect(() => {
    void load();
  },[load])
  
  const [tab, setTab] = useState<Tab>('ingredients');
  const [servings, setServings] = useState<number>(1);
  // Scale ingredient/nutrition amounts relative to the recipe's base servings.
  const factor = servings / (recipe?.servings ?? 1);
  const mealColor = MEALS.find((m) => m.type === mealType)?.color ?? ACCENT;

  // API stores instructions as one string; render as numbered steps.
  const steps = (recipe?.instructions ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  // Build nutrition rows from the flat recipe fields (the API has no array).
  const nutrition = recipe
    ? [
        { label: 'Calories', value: `${Number(recipe.calories ?? 0)} kcal` },
        { label: 'Protein', value: `${Number(recipe.protein ?? 0)} g` },
        { label: 'Carbs', value: `${Number(recipe.carbs ?? 0)} g` },
        { label: 'Fat', value: `${Number(recipe.fat ?? 0)} g` },
      ]
    : [];

  const remove = () => {
    Alert.alert('Remove dish?', `“${recipe?.title}” will be removed from this meal.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!id || !date || !mealType) return;
          try {
            await mealPlansApi.remove(id);
            plannerStore.remove(date, mealType as MealType, id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to remove dish.');
          }
        },
      },
    ]);
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* banner */}
        <View style={[styles.banner, { backgroundColor: mealColor }]}>
          <Ionicons name="fish-outline" size={54} color="#fff" />
          <View style={styles.badge}>
            <Text style={styles.badgeT}>{recipe?.cuisine}</Text>
          </View>
        </View>

        {error ? (
          <ErrorBar message={error} onRetry={()=>load()} />
        ) : null}

        {loading && <ActivityIndicator color={ACCENT} style={styles.loader} />}

        <View style={{ padding: 20, gap: 12 }}>
          <Text style={styles.title}>{recipe?.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={styles.meta}>{recipe?.cookTime} min</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="person-outline" size={13} color="#888" />
            <Text style={styles.meta}>
              {servings} serving{servings > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={ACCENT} />
            <Text style={styles.aiT}>Created by AI</Text>
          </View>

          {/* tabs */}
          <View style={styles.tabs}>
            {(['ingredients', 'instructions', 'nutrition'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabT, tab === t && styles.tabTActive]}>
                  {t[0].toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === 'ingredients' && (
            <View style={{ gap: 12 }}>
              <View style={styles.stepper}>
                <Text style={styles.stepperLabel}>Servings</Text>
                <View style={styles.stepperControls}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => setServings((s) => Math.max(1, s - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#333" />
                  </Pressable>
                  <Text style={styles.stepVal}>{servings}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => setServings((s) => s + 1)}>
                    <Ionicons name="add" size={18} color="#333" />
                  </Pressable>
                </View>
              </View>
              {(recipe?.ingredients ?? []).map((ing) => (
                <View key={ing.ingredientName} style={styles.ingRow}>
                  <View style={styles.ingIcon}>
                    <Ionicons name="ellipse" size={10} color={ACCENT} />
                  </View>
                  <Text style={styles.ingName}>{ing.ingredientName}</Text>
                  <Text style={styles.ingAmt}>
                    {scaleAmount(`${ing.quantity ?? ''} ${ing.unit ?? ''}`.trim(), factor)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'instructions' && (
            <View style={{ gap: 14 }}>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepItem}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumT}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'nutrition' && (
            <View style={styles.nutTable}>
              {nutrition.map((n) => (
                <View key={n.label} style={styles.nutRow}>
                  <Text style={styles.nutLabel}>{n.label}</Text>
                  <Text style={styles.nutVal}>{scaleAmount(n.value, factor)}</Text>
                </View>
              ))}
              <Text style={styles.nutNote}>
                * Per {servings} serving{servings > 1 ? 's' : ''}, based on a 2,000 kcal/day diet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* bottom action bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.saveBtn}>
          <Ionicons name="bookmark-outline" size={18} color={ACCENT} />
          <Text style={styles.saveT}>Save</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={remove}>
          <Ionicons name="trash-outline" size={18} color={DANGER} />
          <Text style={styles.deleteT}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 20 },
  banner: { height: 160, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    left: 16,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeT: { fontSize: 12, fontWeight: '600', color: '#333' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: '#888' },
  metaDot: { fontSize: 13, color: '#CCC', marginHorizontal: 2 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: ACCENT + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiT: { fontSize: 12, color: ACCENT, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', marginTop: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: ACCENT },
  tabT: { fontSize: 14, color: '#999' },
  tabTActive: { color: ACCENT, fontWeight: '700' },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
  },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { fontSize: 16, fontWeight: '700', color: '#111', minWidth: 20, textAlign: 'center' },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  ingIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingName: { flex: 1, fontSize: 15, color: '#222' },
  ingAmt: { fontSize: 14, color: '#888', fontWeight: '600' },
  stepItem: { flexDirection: 'row', gap: 12 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumT: { fontSize: 13, fontWeight: '700', color: ACCENT },
  stepText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },
  nutTable: { gap: 2 },
  nutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  nutLabel: { flex: 1, fontSize: 15, color: '#333' },
  nutVal: { fontSize: 15, fontWeight: '600', color: '#111', marginRight: 16 },
  nutNote: { fontSize: 11, color: '#AAA', marginTop: 8 },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#fff',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveT: { color: ACCENT, fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: DANGER + '0D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteT: { color: DANGER, fontWeight: '700' },
});
