import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function CreateRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRecipe = () => {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      Alert.alert('Missing information', 'Please fill in title, ingredients, and instructions.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert('Recipe created', 'Your recipe has been saved.');
      router.back();
    }, 800);
  };

  return (
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
        placeholder="Ingredients"
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
