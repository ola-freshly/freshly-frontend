import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { recipesApi } from '@/api';
import AppPopup from '@/components/AppPopup';

export default function CreateRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    shouldGoBack: false,
  });

  const showPopup = (popupTitle: string, message: string, shouldGoBack = false) => {
    setPopup({ visible: true, title: popupTitle, message, shouldGoBack });
  };

  const closePopup = () => {
    const shouldGoBack = popup.shouldGoBack;
    setPopup({ visible: false, title: '', message: '', shouldGoBack: false });

    if (shouldGoBack) {
      router.back();
    }
  };

  const handleCreateRecipe = async () => {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      showPopup('Missing information', 'Please fill in title, ingredients, and instructions.');
      return;
    }

    try {
      setLoading(true);

      await recipesApi.createRecipe({
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients
          .split(',')
          .map((ingredient) => ingredient.trim())
          .filter(Boolean),
        instructions: instructions.trim(),
        servings: 2,
        estimatedTime: 30,
      });

      showPopup('Recipe created', 'Your recipe has been saved.', true);
    } catch {
      showPopup('Error', 'Unable to create recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Recipe</Text>
        <Text style={styles.subtitle}>Add your own recipe manually.</Text>

        <TextInput
          style={styles.input}
          placeholder="Recipe title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ingredients, separated by commas"
          multiline
          value={ingredients}
          onChangeText={setIngredients}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Cooking instructions"
          multiline
          value={instructions}
          onChangeText={setInstructions}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleCreateRecipe}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Recipe'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <AppPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 6, marginBottom: 24, color: '#6b7280', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
