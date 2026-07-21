import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { recipesApi, type Recipe } from '@/api';
import { notifyError, notifySuccess, tapLight } from '@/utils/haptics';

const ACCENT = '#16A34A';
const DANGER = '#DC2626';

type Tab = 'ingredients' | 'instructions' | 'nutrition';

const toNumber = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const roundish = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('ingredients');
  const [servings, setServings] = useState(1);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await recipesApi.getRecipeById(id);
        if (!active) return;
        setRecipe(data);
        setServings(data.servings && data.servings > 0 ? data.servings : 1);
      } catch {
        if (active) setError('Unable to load this recipe.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const confirmDelete = () => {
    if (!recipe) return;
    Alert.alert('Delete recipe?', `“${recipe.title}” will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await recipesApi.deleteRecipe(recipe.id);
            notifySuccess();
            router.back();
          } catch {
            notifyError();
            setDeleting(false);
            Alert.alert('Unable to delete', 'Please check your connection and try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Recipe' }} />
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Recipe' }} />
        <Ionicons name="alert-circle-outline" size={40} color="#C4C4C4" />
        <Text style={styles.errorText} selectable>
          {error || 'Recipe not found.'}
        </Text>
      </View>
    );
  }

  const baseServings = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
  const factor = servings / baseServings;

  const ingredients = recipe.ingredients ?? [];

  const steps = recipe.instructions
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  const nutrition = [
    { label: 'Calories', raw: toNumber(recipe.calories), unit: 'kcal' },
    { label: 'Protein', raw: toNumber(recipe.protein), unit: 'g' },
    { label: 'Carbs', raw: toNumber(recipe.carbs), unit: 'g' },
    { label: 'Fat', raw: toNumber(recipe.fat), unit: 'g' },
  ].filter((n) => n.raw != null);

  const ingredientAmount = (quantity?: number, unit?: string) => {
    const qty = toNumber(quantity);
    if (qty == null) return unit ?? '';
    const scaled = roundish(qty * factor);
    return unit ? `${scaled} ${unit}` : scaled;
  };

  const switchTab = (t: Tab) => {
    tapLight();
    setTab(t);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ title: recipe.title }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* banner */}
        <View style={styles.banner}>
          <Ionicons name="restaurant" size={54} color="#fff" />
          {recipe.cuisine ? (
            <View style={styles.badge}>
              <Text style={styles.badgeT}>{recipe.cuisine}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ padding: 20, gap: 12 }}>
          <Text style={styles.title} selectable>
            {recipe.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={styles.meta}>{recipe.cookTime ?? 0} min</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="person-outline" size={13} color="#888" />
            <Text style={styles.meta}>
              {servings} serving{servings > 1 ? 's' : ''}
            </Text>
          </View>

          {recipe.description ? (
            <Text style={styles.description} selectable>
              {recipe.description}
            </Text>
          ) : null}

          {/* tabs */}
          <View style={styles.tabs}>
            {(['ingredients', 'instructions', 'nutrition'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => switchTab(t)}
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
                    onPress={() => {
                      tapLight();
                      setServings((s) => Math.max(1, s - 1));
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#333" />
                  </Pressable>
                  <Text style={styles.stepVal}>{servings}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => {
                      tapLight();
                      setServings((s) => s + 1);
                    }}
                  >
                    <Ionicons name="add" size={18} color="#333" />
                  </Pressable>
                </View>
              </View>

              {ingredients.length === 0 ? (
                <Text style={styles.emptyTab}>No ingredients listed for this recipe.</Text>
              ) : (
                ingredients.map((ing, index) => (
                  <View key={`${ing.ingredientName}-${index}`} style={styles.ingRow}>
                    <View style={styles.ingIcon}>
                      <Ionicons name="ellipse" size={10} color={ACCENT} />
                    </View>
                    <Text style={styles.ingName}>{ing.ingredientName}</Text>
                    <Text style={styles.ingAmt}>{ingredientAmount(ing.quantity, ing.unit)}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'instructions' && (
            <View style={{ gap: 14 }}>
              {steps.length === 0 ? (
                <Text style={styles.emptyTab}>No instructions provided.</Text>
              ) : (
                steps.map((step, i) => (
                  <View key={i} style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumT}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText} selectable>
                      {step}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'nutrition' && (
            <View style={styles.nutTable}>
              {nutrition.length === 0 ? (
                <Text style={styles.emptyTab}>No nutrition data for this recipe.</Text>
              ) : (
                <>
                  {nutrition.map((n) => (
                    <View key={n.label} style={styles.nutRow}>
                      <Text style={styles.nutLabel}>{n.label}</Text>
                      <Text style={styles.nutVal}>
                        {roundish(n.raw! * factor)} {n.unit}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.nutNote}>
                    * Per {servings} serving{servings > 1 ? 's' : ''}.
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* bottom action bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.deleteBtn, deleting && styles.disabled]}
          disabled={deleting}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={18} color={DANGER} />
          <Text style={styles.deleteT}>{deleting ? 'Deleting…' : 'Delete recipe'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
  },
  errorText: { color: '#9CA3AF', fontSize: 15 },

  banner: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  badge: {
    position: 'absolute',
    left: 16,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  badgeT: { fontSize: 12, fontWeight: '600', color: '#333' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: '#888' },
  metaDot: { fontSize: 13, color: '#CCC', marginHorizontal: 2 },
  description: { fontSize: 14, color: '#555', lineHeight: 21 },

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
    borderCurve: 'continuous',
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
    borderCurve: 'continuous',
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
  nutVal: { fontSize: 15, fontWeight: '600', color: '#111' },
  nutNote: { fontSize: 11, color: '#AAA', marginTop: 8 },

  emptyTab: { fontSize: 14, color: '#9CA3AF', paddingVertical: 12 },

  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#fff',
  },
  deleteBtn: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: DANGER + '0D',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteT: { color: DANGER, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
