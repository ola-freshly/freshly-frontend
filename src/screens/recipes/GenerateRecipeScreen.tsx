import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function GenerateRecipeScreen() {
  const [preferences, setPreferences] = useState('');
  const [servings, setServings] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState('');

  const handleGenerateRecipe = () => {
    setLoading(true);

    setTimeout(() => {
      setGeneratedRecipe(
        'Fresh Pantry Bowl\n\nUse your available pantry ingredients to create a quick balanced meal. Mix cooked grains, vegetables, protein, and a simple sauce. Season to taste and serve warm.',
      );
      setLoading(false);
    }, 1000);
  };

  const handleUseRecipe = () => {
    if (!generatedRecipe) {
      Alert.alert('No recipe yet', 'Please generate a recipe first.');
      return;
    }

    Alert.alert('Recipe ready', 'You can edit this generated recipe before saving.');
    router.push('/create-recipe');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI Recipe Generator</Text>
      <Text style={styles.subtitle}>Generate recipe ideas from your pantry ingredients.</Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Preferences, cuisine, allergies, or meal idea"
        multiline
        value={preferences}
        onChangeText={setPreferences}
      />

      <TextInput
        style={styles.input}
        placeholder="Servings"
        keyboardType="number-pad"
        value={servings}
        onChangeText={setServings}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={handleGenerateRecipe}
      >
        <Text style={styles.buttonText}>{loading ? 'Generating...' : 'Generate Recipe'}</Text>
      </TouchableOpacity>

      {generatedRecipe ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Generated Recipe</Text>
          <Text style={styles.resultText}>{generatedRecipe}</Text>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleUseRecipe}>
            <Text style={styles.secondaryButtonText}>Edit Generated Recipe</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  resultText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  secondaryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#208AEF', fontSize: 15, fontWeight: '700' },
});
