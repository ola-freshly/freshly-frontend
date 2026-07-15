import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { recipesApi } from '@/api';
import FeedbackModal from '@/components/FeedbackModal';
import type { GeneratedRecipe } from '@/api';

type FeedbackState = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
};

export default function GenerateRecipeScreen() {
  const [pantryItems, setPantryItems] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showFeedback = (title: string, message: string, type: 'success' | 'error') => {
    setFeedback({
      visible: true,
      title,
      message,
      type,
    });
  };

  const closeFeedback = () => {
    setFeedback((current) => ({
      ...current,
      visible: false,
    }));
  };

  const handleGenerate = async () => {
    if (!pantryItems.trim()) {
      showFeedback(
        'Missing pantry items',
        'Please enter pantry items before generating a recipe.',
        'error',
      );
      return;
    }

    try {
      setLoading(true);
      setGeneratedRecipe(null);

      const recipe = await recipesApi.generateRecipe({
        pantryItems: pantryItems
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        preferences: preferences.trim() || undefined,
      });

      setGeneratedRecipe(recipe);

      showFeedback(
        'Recipe generated',
        'Your AI recipe is ready. You can review and edit it below.',
        'success',
      );
    } catch {
      showFeedback(
        'Unable to generate recipe',
        'Please check your connection and try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Recipe Generator</Text>
        <Text style={styles.subtitle}>
          Enter your pantry items and preferences to generate a recipe.
        </Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Pantry items, separated by commas"
          multiline
          value={pantryItems}
          onChangeText={setPantryItems}
        />

        <TextInput
          style={styles.input}
          placeholder="Preferences, cuisine, or allergies"
          value={preferences}
          onChangeText={setPreferences}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabled]}
          disabled={loading}
          onPress={handleGenerate}
        >
          <Text style={styles.buttonText}>{loading ? 'Generating...' : 'Generate Recipe'}</Text>
        </TouchableOpacity>

        {generatedRecipe ? (
          <View style={styles.resultCard}>
            <TextInput
              style={styles.resultTitle}
              value={generatedRecipe.title}
              onChangeText={(value) =>
                setGeneratedRecipe((current) => (current ? { ...current, title: value } : current))
              }
            />

            <TextInput
              style={[styles.resultInput, styles.resultTextArea]}
              value={generatedRecipe.description ?? ''}
              placeholder="Description"
              multiline
              onChangeText={(value) =>
                setGeneratedRecipe((current) =>
                  current ? { ...current, description: value } : current,
                )
              }
            />

            <Text style={styles.label}>Ingredients</Text>

            <TextInput
              style={[styles.resultInput, styles.resultTextArea]}
              value={generatedRecipe.ingredients.join(', ')}
              multiline
              onChangeText={(value) =>
                setGeneratedRecipe((current) =>
                  current
                    ? {
                        ...current,
                        ingredients: value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }
                    : current,
                )
              }
            />

            <Text style={styles.label}>Instructions</Text>

            <TextInput
              style={[styles.resultInput, styles.instructionsInput]}
              value={generatedRecipe.instructions}
              multiline
              onChangeText={(value) =>
                setGeneratedRecipe((current) =>
                  current ? { ...current, instructions: value } : current,
                )
              }
            />

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Time</Text>
                <TextInput
                  style={styles.detailInput}
                  keyboardType="number-pad"
                  value={String(generatedRecipe.estimatedTime)}
                  onChangeText={(value) =>
                    setGeneratedRecipe((current) =>
                      current
                        ? {
                            ...current,
                            estimatedTime: Number(value) || 0,
                          }
                        : current,
                    )
                  }
                />
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Servings</Text>
                <TextInput
                  style={styles.detailInput}
                  keyboardType="number-pad"
                  value={String(generatedRecipe.servings)}
                  onChangeText={(value) =>
                    setGeneratedRecipe((current) =>
                      current
                        ? {
                            ...current,
                            servings: Number(value) || 0,
                          }
                        : current,
                    )
                  }
                />
              </View>
            </View>

            {generatedRecipe.missingIngredients?.length ? (
              <View style={styles.missingCard}>
                <Text style={styles.missingTitle}>Missing ingredients</Text>
                <Text style={styles.missingText}>
                  {generatedRecipe.missingIngredients.join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  resultCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 10,
    marginBottom: 14,
  },
  resultInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#374151',
  },
  resultTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  instructionsInput: {
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  missingCard: {
    marginTop: 16,
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fef2f2',
  },
  missingTitle: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  missingText: {
    marginTop: 4,
    color: '#991b1b',
    lineHeight: 20,
  },
});
