import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { recipesApi } from '@/api';
import DropdownField, { type DropdownOption } from '@/components/DropdownField';
import FeedbackModal from '@/components/FeedbackModal';
import { notifyError, notifySuccess, tapLight } from '@/utils/haptics';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';

type FeedbackState = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
};

type IngredientRow = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

type StepRow = {
  id: string;
  text: string;
};

let rowCounter = 0;
const nextId = () => {
  rowCounter += 1;
  return `row-${rowCounter}`;
};

const emptyIngredient = (): IngredientRow => ({ id: nextId(), name: '', quantity: '', unit: '' });
const emptyStep = (): StepRow => ({ id: nextId(), text: '' });

const SERVINGS_OPTIONS: DropdownOption[] = Array.from({ length: 12 }, (_, index) => ({
  label: `${index + 1} ${index === 0 ? 'serving' : 'servings'}`,
  value: index + 1,
}));

const COOK_TIME_OPTIONS: DropdownOption[] = [5, 10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => ({
  label: `${minutes} min`,
  value: minutes,
}));

export default function CreateRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()]);
  const [ingredientPaste, setIngredientPaste] = useState('');
  const [steps, setSteps] = useState<StepRow[]>([emptyStep()]);
  const [stepPaste, setStepPaste] = useState('');
  const [servings, setServings] = useState<number | null>(null);
  const [cookTime, setCookTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldGoBack, setShouldGoBack] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showFeedback = (feedbackTitle: string, message: string, type: 'success' | 'error') => {
    setFeedback({ visible: true, title: feedbackTitle, message, type });
  };

  const closeFeedback = () => {
    setFeedback((current) => ({ ...current, visible: false }));
    if (shouldGoBack) {
      setShouldGoBack(false);
      router.back();
    }
  };

  // ----- Ingredient rows -----
  const addIngredient = () => {
    tapLight();
    setIngredients((rows) => [...rows, emptyIngredient()]);
  };

  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) =>
    setIngredients((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const removeIngredient = (id: string) => {
    tapLight();
    setIngredients((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  };

  const addPastedIngredients = () => {
    const parsed = ingredientPaste
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({ ...emptyIngredient(), name }));

    if (parsed.length === 0) return;

    tapLight();
    setIngredients((rows) => {
      const existing = rows.filter((row) => row.name.trim());
      return [...existing, ...parsed];
    });
    setIngredientPaste('');
  };

  // ----- Instruction steps -----
  const addStep = () => {
    tapLight();
    setSteps((rows) => [...rows, emptyStep()]);
  };

  const updateStep = (id: string, value: string) =>
    setSteps((rows) => rows.map((row) => (row.id === id ? { ...row, text: value } : row)));

  const removeStep = (id: string) => {
    tapLight();
    setSteps((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  };

  const addPastedSteps = () => {
    const parsed = stepPaste
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ ...emptyStep(), text }));

    if (parsed.length === 0) return;

    tapLight();
    setSteps((rows) => {
      const existing = rows.filter((row) => row.text.trim());
      return [...existing, ...parsed];
    });
    setStepPaste('');
  };

  const cleanIngredients = useMemo(
    () => ingredients.filter((row) => row.name.trim()),
    [ingredients],
  );
  const cleanSteps = useMemo(() => steps.filter((row) => row.text.trim()), [steps]);

  const handleSave = async () => {
    if (!title.trim() || cleanIngredients.length === 0 || cleanSteps.length === 0) {
      notifyError();
      showFeedback(
        'Missing information',
        'Please add a title, at least one ingredient, and at least one step.',
        'error',
      );
      return;
    }

    try {
      tapLight();
      setLoading(true);

      await recipesApi.createRecipe({
        title: title.trim(),
        description: description.trim() || undefined,
        servings: servings ?? undefined,
        cookTime: cookTime ?? undefined,
        instructions: cleanSteps
          .map((step, index) => `${index + 1}. ${step.text.trim()}`)
          .join('\n'),
        ingredients: cleanIngredients.map((row) => ({
          ingredientName: row.name.trim(),
          quantity: row.quantity.trim() ? Number(row.quantity) || undefined : undefined,
          unit: row.unit.trim() || undefined,
        })),
      });

      setShouldGoBack(true);
      notifySuccess();
      showFeedback('Recipe created', 'Your recipe has been saved.', 'success');
    } catch {
      notifyError();
      showFeedback(
        'Unable to create recipe',
        'Please check your connection and try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add recipe',
          headerTitleAlign: 'left',
          headerTintColor: '#111827',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              style={[styles.savePill, loading && styles.disabled]}
              disabled={loading}
              onPress={handleSave}
            >
              <Text style={styles.savePillText}>{loading ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.sectionTitle}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Name your recipe"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Introduce your recipe, add notes, cooking tips, serving suggestions, etc…"
          placeholderTextColor="#9CA3AF"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Ingredients */}
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <TouchableOpacity style={styles.addPill} onPress={addIngredient}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addPillText}>Ingredient</Text>
        </TouchableOpacity>

        {ingredients.map((row) => (
          <Animated.View
            key={row.id}
            style={styles.rowCard}
            entering={FadeInDown.springify().damping(15)}
            exiting={FadeOut.duration(150)}
          >
            <TextInput
              style={[styles.rowInput, styles.rowName]}
              placeholder="Ingredient"
              placeholderTextColor="#9CA3AF"
              value={row.name}
              onChangeText={(value) => updateIngredient(row.id, 'name', value)}
            />
            <TextInput
              style={[styles.rowInput, styles.rowQty]}
              placeholder="Qty"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={row.quantity}
              onChangeText={(value) => updateIngredient(row.id, 'quantity', value)}
            />
            <TextInput
              style={[styles.rowInput, styles.rowUnit]}
              placeholder="Unit"
              placeholderTextColor="#9CA3AF"
              value={row.unit}
              onChangeText={(value) => updateIngredient(row.id, 'unit', value)}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeIngredient(row.id)}
              accessibilityLabel="Remove ingredient"
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.pasteBox}>
          <TextInput
            style={styles.pasteInput}
            placeholder="… or paste multiple ingredients here"
            placeholderTextColor="#9CA3AF"
            multiline
            value={ingredientPaste}
            onChangeText={setIngredientPaste}
          />
          {ingredientPaste.trim() ? (
            <TouchableOpacity style={styles.pasteAdd} onPress={addPastedIngredients}>
              <Text style={styles.pasteAddText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Instructions */}
        <Text style={styles.sectionTitle}>Instructions</Text>
        <TouchableOpacity style={styles.addPill} onPress={addStep}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addPillText}>Step</Text>
        </TouchableOpacity>

        {steps.map((row, index) => (
          <Animated.View
            key={row.id}
            style={styles.rowCard}
            entering={FadeInDown.springify().damping(15)}
            exiting={FadeOut.duration(150)}
          >
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <TextInput
              style={[styles.rowInput, styles.stepInput]}
              placeholder={`Step ${index + 1}`}
              placeholderTextColor="#9CA3AF"
              multiline
              value={row.text}
              onChangeText={(value) => updateStep(row.id, value)}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeStep(row.id)}
              accessibilityLabel="Remove step"
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.pasteBox}>
          <TextInput
            style={styles.pasteInput}
            placeholder="… or paste all instructions here"
            placeholderTextColor="#9CA3AF"
            multiline
            value={stepPaste}
            onChangeText={setStepPaste}
          />
          {stepPaste.trim() ? (
            <TouchableOpacity style={styles.pasteAdd} onPress={addPastedSteps}>
              <Text style={styles.pasteAddText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Servings */}
        <Text style={styles.sectionTitle}>Servings</Text>
        <DropdownField
          placeholder="Set servings"
          value={servings}
          options={SERVINGS_OPTIONS}
          onSelect={setServings}
        />

        {/* Cook time */}
        <Text style={styles.sectionTitle}>Cook time</Text>
        <DropdownField
          placeholder="Set time"
          value={cookTime}
          options={COOK_TIME_OPTIONS}
          onSelect={setCookTime}
        />
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: ACCENT,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginBottom: 14,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  addPillText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rowInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  rowName: { flex: 1 },
  rowQty: { width: 64, textAlign: 'center' },
  rowUnit: { width: 72, textAlign: 'center' },
  stepInput: { flex: 1, minHeight: 46, textAlignVertical: 'top' },
  stepNumber: {
    width: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: ACCENT,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_LIGHT,
  },

  pasteBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  pasteInput: {
    minHeight: 72,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  pasteAdd: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  pasteAddText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  savePill: {
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)',
  },
  savePillText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },
});
