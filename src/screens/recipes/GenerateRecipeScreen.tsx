import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { pantryApi, recipesApi } from '@/api';
import type { GeneratedRecipe, PantryItem } from '@/api';
import FeedbackModal from '@/components/FeedbackModal';
import { MEALS, type MealType } from '@/screens/mealplan/theme';
import { previewToCreateRequest } from '@/screens/recipes/recipe-mapping';
import { tapLight } from '@/utils/haptics';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';
const ACCENT_DIM = '#DCFCE7';
const DANGER = '#DC2626';

const CUISINES = ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean'];

type FeedbackState = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
};

export default function GenerateRecipeScreen() {
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [pantryLoading, setPantryLoading] = useState(true);

  const [mealType, setMealType] = useState<MealType | null>(null);
  const [cuisine, setCuisine] = useState('');
  const [servings, setServings] = useState(2);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<GeneratedRecipe | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await pantryApi.getAll();
        if (active) setPantry(items);
      } catch {
        // Non-fatal: the generator still works; the AI lists everything as missing.
      } finally {
        if (active) setPantryLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const showFeedback = (title: string, message: string, type: 'success' | 'error') =>
    setFeedback({ visible: true, title, message, type });

  const closeFeedback = () => setFeedback((c) => ({ ...c, visible: false }));

  const handleGenerate = async () => {
    tapLight();
    try {
      setLoading(true);
      setPreview(null);
      const recipe = await recipesApi.generateRecipe({
        mealType: mealType ?? undefined,
        cuisine: cuisine.trim() || undefined,
        servings,
        notes: notes.trim() || undefined,
      });
      setPreview(recipe);
    } catch {
      showFeedback(
        'Unable to generate recipe',
        'The AI could not create a recipe right now. Please check your connection and try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    tapLight();
    try {
      setSaving(true);
      const saved = await recipesApi.createRecipe(previewToCreateRequest(preview));
      router.replace({ pathname: '/recipe-detail', params: { id: saved.id } });
    } catch {
      showFeedback('Unable to save recipe', 'Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Recipe Generator',
          headerTitleAlign: 'left',
          headerTintColor: '#111827',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="sparkles" size={20} color={ACCENT} />
          </View>
          <Text style={styles.subtitle}>
            Tell us what you feel like — we&apos;ll cook something from your pantry.
          </Text>
        </View>

        {/* Pantry preview */}
        <View style={styles.pantryCard}>
          <View style={styles.pantryHeader}>
            <Ionicons name="basket-outline" size={16} color={ACCENT} />
            <Text style={styles.pantryTitle}>Cooking from your pantry</Text>
          </View>
          {pantryLoading ? (
            <ActivityIndicator color={ACCENT} style={styles.pantrySpinner} />
          ) : pantry.length ? (
            <View style={styles.chipRow}>
              {pantry.slice(0, 12).map((p) => (
                <View key={p.id} style={styles.pantryChip}>
                  <Text style={styles.pantryChipText}>{p.name}</Text>
                </View>
              ))}
              {pantry.length > 12 ? (
                <View style={styles.pantryChip}>
                  <Text style={styles.pantryChipText}>+{pantry.length - 12} more</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.pantryEmpty}>
              Your pantry is empty — the recipe will list everything you&apos;ll need to buy.
            </Text>
          )}
        </View>

        {/* Meal type */}
        <Text style={styles.label}>Meal type</Text>
        <View style={styles.chipRow}>
          {MEALS.map((m) => {
            const selected = mealType === m.type;
            return (
              <TouchableOpacity
                key={m.type}
                style={[styles.mealChip, selected && styles.mealChipSelected]}
                activeOpacity={0.85}
                onPress={() => {
                  tapLight();
                  setMealType(selected ? null : m.type);
                }}
              >
                <Ionicons name={m.icon} size={16} color={selected ? '#fff' : m.color} />
                <Text style={[styles.mealChipText, selected && styles.mealChipTextSelected]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cuisine */}
        <Text style={styles.label}>Cuisine</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Italian, Thai (optional)"
          placeholderTextColor="#9CA3AF"
          value={cuisine}
          onChangeText={setCuisine}
        />
        <View style={styles.chipRow}>
          {CUISINES.map((c) => {
            const selected = cuisine.trim().toLowerCase() === c.toLowerCase();
            return (
              <TouchableOpacity
                key={c}
                style={[styles.suggestChip, selected && styles.suggestChipSelected]}
                activeOpacity={0.85}
                onPress={() => {
                  tapLight();
                  setCuisine(selected ? '' : c);
                }}
              >
                <Text style={[styles.suggestChipText, selected && styles.suggestChipTextSelected]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Servings */}
        <Text style={styles.label}>Servings</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            activeOpacity={0.85}
            onPress={() => {
              tapLight();
              setServings((s) => Math.max(1, s - 1));
            }}
          >
            <Ionicons name="remove" size={20} color={ACCENT} />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{servings}</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            activeOpacity={0.85}
            onPress={() => {
              tapLight();
              setServings((s) => Math.min(12, s + 1));
            }}
          >
            <Ionicons name="add" size={20} color={ACCENT} />
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <Text style={styles.label}>Extra details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. high protein, no dairy, make it spicy (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.disabled]}
          activeOpacity={0.85}
          disabled={loading}
          onPress={handleGenerate}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Generate Recipe</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Preview */}
        {preview ? (
          <Animated.View
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOut}
            style={styles.previewCard}
          >
            <Text style={styles.previewTitle} selectable>
              {preview.title}
            </Text>
            {preview.description ? (
              <Text style={styles.previewDesc}>{preview.description}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={ACCENT} />
                <Text style={styles.metaText}>{preview.estimatedMinutes} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color={ACCENT} />
                <Text style={styles.metaText}>{preview.servings} servings</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={16} color={ACCENT} />
                <Text style={styles.metaText}>{Math.round(preview.nutrition.calories)} kcal</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Ingredients</Text>
            {preview.ingredients.map((i, idx) => (
              <Text key={`ing-${idx}`} style={styles.listItem} selectable>
                • {i.quantity} {i.unit} {i.name}
              </Text>
            ))}

            {preview.missingIngredients.length ? (
              <View style={styles.missingCard}>
                <Text style={styles.missingTitle}>You&apos;ll need to buy</Text>
                {preview.missingIngredients.map((i, idx) => (
                  <Text key={`miss-${idx}`} style={styles.missingText} selectable>
                    • {i.quantity} {i.unit} {i.name}
                  </Text>
                ))}
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Instructions</Text>
            {preview.instructions.map((step, idx) => (
              <View key={`step-${idx}`} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText} selectable>
                  {step}
                </Text>
              </View>
            ))}

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.flex1, saving && styles.disabled]}
                activeOpacity={0.85}
                disabled={saving}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="bookmark-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Save recipe</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, styles.flex1, loading && styles.disabled]}
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleGenerate}
              >
                {loading ? (
                  <ActivityIndicator color={ACCENT} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color={ACCENT} />
                    <Text style={styles.secondaryBtnText}>Generate another</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <FeedbackModal
        visible={feedback.visible}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
        onClose={closeFeedback}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },
  flex1: { flex: 1 },

  intro: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { flex: 1, color: '#6B7280', fontSize: 14, lineHeight: 20 },

  pantryCard: {
    backgroundColor: ACCENT_LIGHT,
    borderColor: ACCENT_DIM,
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 14,
    marginBottom: 22,
  },
  pantryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pantryTitle: { fontSize: 13, fontWeight: '700', color: ACCENT },
  pantrySpinner: { marginTop: 4, alignSelf: 'flex-start' },
  pantryChip: {
    backgroundColor: '#fff',
    borderColor: ACCENT_DIM,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pantryChipText: { fontSize: 12, color: '#166534', fontWeight: '600' },
  pantryEmpty: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

  label: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  mealChipSelected: { backgroundColor: ACCENT, borderColor: ACCENT },
  mealChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  mealChipTextSelected: { color: '#fff' },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top', marginBottom: 20 },

  suggestChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: '#fff',
  },
  suggestChipSelected: { backgroundColor: ACCENT_DIM, borderColor: ACCENT },
  suggestChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  suggestChipTextSelected: { color: '#166534' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 6,
    marginBottom: 20,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingVertical: 15,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT_LIGHT,
    borderWidth: 1,
    borderColor: ACCENT_DIM,
    paddingVertical: 15,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  secondaryBtnText: { color: ACCENT, fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },

  previewCard: {
    marginTop: 26,
    padding: 18,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: ACCENT_DIM,
  },
  previewTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  previewDesc: { marginTop: 6, color: '#6B7280', fontSize: 14, lineHeight: 20 },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  listItem: { fontSize: 14, color: '#374151', lineHeight: 22 },

  missingCard: {
    marginTop: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  missingTitle: { color: DANGER, fontWeight: '700', marginBottom: 4 },
  missingText: { color: '#991B1B', fontSize: 14, lineHeight: 21 },

  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT_DIM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  stepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 21 },

  previewActions: { flexDirection: 'row', gap: 12, marginTop: 22 },
});
