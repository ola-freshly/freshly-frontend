import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { recipesApi, type Recipe } from '@/api';

type Tab = 'recommended' | 'import';

export default function RecipesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('recommended');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await recipesApi.getRecipes();
        setRecipes(data);
      } catch {
        setError('Unable to load recipes.');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'recommended' && styles.segmentActive]}
          onPress={() => setActiveTab('recommended')}
        >
          <Text
            style={[styles.segmentText, activeTab === 'recommended' && styles.segmentTextActive]}
          >
            Recommended
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, activeTab === 'import' && styles.segmentActive]}
          onPress={() => setActiveTab('import')}
        >
          <Text style={[styles.segmentText, activeTab === 'import' && styles.segmentTextActive]}>
            Import
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/create-recipe')}>
          <Text style={styles.actionButtonText}>Create Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/generate-recipe')}
        >
          <Text style={styles.actionButtonText}>AI Generator</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'recommended' && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : error ? (
            <Text style={styles.empty}>{error}</Text>
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/recipe-detail',
                      params: { id: item.id },
                    })
                  }
                >
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>
                    {item.estimatedTime ?? 0} min • {item.servings ?? 0} servings
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No recipes found.</Text>}
            />
          )}
        </View>
      )}

      {activeTab === 'import' && (
        <View style={styles.content}>
          <Text style={styles.empty}>Paste a YouTube cooking video URL to import a recipe.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  segmentRow: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentActive: { backgroundColor: '#208AEF' },
  segmentText: { fontSize: 14, color: '#666' },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#208AEF',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { marginTop: 4, color: '#666' },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 15,
  },
});
