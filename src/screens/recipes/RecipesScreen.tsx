import { Ionicons } from '@expo/vector-icons';
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
import Animated, { FadeInDown } from 'react-native-reanimated';

import { recipesApi, type Recipe } from '@/api';
import { tapLight } from '@/utils/haptics';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';

export default function RecipesScreen() {
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

  const goTo = (path: '/create-recipe' | '/generate-recipe') => {
    tapLight();
    router.push(path);
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          activeOpacity={0.85}
          onPress={() => goTo('/create-recipe')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.actionButtonPrimaryText}>Create Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          activeOpacity={0.85}
          onPress={() => goTo('/generate-recipe')}
        >
          <Ionicons name="sparkles-outline" size={18} color={ACCENT} />
          <Text style={styles.actionButtonSecondaryText}>AI Generator</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.empty} selectable>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 60)
                .springify()
                .damping(18)}
            >
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/recipe-detail', params: { id: item.id } });
                }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="restaurant-outline" size={22} color={ACCENT} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>
                    {item.cookTime ?? 0} min • {item.servings ?? 0} servings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="restaurant-outline" size={40} color="#C4C4C4" />
              <Text style={styles.empty}>
                No recipes yet. Create or generate one to get started.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  actionButtonPrimary: {
    backgroundColor: ACCENT,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  actionButtonPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionButtonSecondary: {
    backgroundColor: ACCENT_LIGHT,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionButtonSecondaryText: { color: ACCENT, fontWeight: '700', fontSize: 15 },

  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6B7280', fontSize: 13 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  empty: { textAlign: 'center', color: '#9CA3AF', fontSize: 15, lineHeight: 22 },
});
