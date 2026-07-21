import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { tapLight } from '@/utils/haptics';
import { useRecipes } from '@/screens/recipes/use-recipes';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';
const DANGER = '#DC2626';

export default function RecipesScreen() {
  const { recipes, loading, refreshing, error, reload, refresh } = useRecipes();

  // Reload whenever the tab regains focus so the list stays fresh after a recipe
  // is created, generated, or deleted on another screen.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const goTo = (path: '/create-recipe' | '/generate-recipe') => {
    tapLight();
    router.push(path);
  };

  const ActionRow = (
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
  );

  // ----- Loading (first load): skeleton cards -----
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {ActionRow}
        <View style={styles.listContent}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={[styles.skeleton, styles.skeletonIcon]} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.skeleton, { height: 14, width: '55%', borderRadius: 6 }]} />
                <View style={[styles.skeleton, { height: 11, width: '32%', borderRadius: 6 }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {ActionRow}

      {error ? (
        <View style={styles.errorBar}>
          <Ionicons name="alert-circle-outline" size={18} color={DANGER} />
          <Text style={styles.errorText} selectable>
            {error}
          </Text>
          <Pressable onPress={reload} hitSlop={8}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={recipes.length === 0 ? styles.emptyWrap : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30)
              .springify()
              .damping(30)}
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
          !error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="restaurant-outline" size={40} color={ACCENT} />
              </View>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptySub}>
                Create your own recipe or generate one with AI to get started.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => goTo('/create-recipe')}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Create your first recipe</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
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

  // Loading skeletons
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  skeleton: { backgroundColor: '#ECECEC' },
  skeletonIcon: { width: 44, height: 44, borderRadius: 12 },

  // Error bar
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: { flex: 1, color: DANGER, fontSize: 13 },
  retry: { color: DANGER, fontWeight: '700', fontSize: 13 },

  // Empty state
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
