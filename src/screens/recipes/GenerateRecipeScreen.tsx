import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { recipesApi } from '@/api';
import AppPopup from '@/components/AppPopup';

export default function GenerateRecipeScreen() {
  const [pantryItems, setPantryItems] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    shouldGoBack: false,
  });

  const showPopup = (title: string, message: string, shouldGoBack = false) => {
    setPopup({ visible: true, title, message, shouldGoBack });
  };

  const closePopup = () => {
    const shouldGoBack = popup.shouldGoBack;
    setPopup({ visible: false, title: '', message: '', shouldGoBack: false });

    if (shouldGoBack) {
      router.back();
    }
  };

  const handleGenerate = async () => {
    if (!pantryItems.trim()) {
      showPopup('Missing pantry items', 'Please enter pantry items before generating a recipe.');
      return;
    }

    try {
      setLoading(true);

      const recipe = await recipesApi.generateRecipe({
        pantryItems: pantryItems
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        preferences,
      });

      showPopup(
        'Recipe Generated',
        `${recipe.title}\n\n${recipe.description ?? 'Your recipe is ready to review.'}`,
        true,
      );
    } catch {
      showPopup('Error', 'Unable to generate recipe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Recipe Generator</Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Pantry items (comma separated)"
          multiline
          value={pantryItems}
          onChangeText={setPantryItems}
        />

        <TextInput
          style={styles.input}
          placeholder="Preferences (optional)"
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

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
