import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PantryItemSource } from '@/api/types';
import { usePantry } from '@/screens/pantry/use-pantry';
import { usePantryForm } from '@/screens/pantry/use-pantry-form';
import { PantryRow } from '@/screens/pantry/pantry-row';
import { PantryItemSheet } from '@/screens/pantry/pantry-item-sheet';
import { buildSections } from '@/screens/pantry/pantry-utils';
import {
  ACCENT,
  ACCENT_DIM,
  ACCENT_LIGHT,
  DANGER,
  MUTED,
  TEXT,
} from '@/screens/pantry/pantry-theme';

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    loading,
    refreshing,
    error,
    showingCached,
    reload,
    refresh,
    addItem,
    editItem,
    deleteItem,
  } = usePantry();
  const form = usePantryForm();

  // Reload on focus so the list re-mounts each visit — this both keeps the
  // pantry fresh and replays the row entrance animation, matching RecipesScreen.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const sections = useMemo(() => buildSections(items), [items]);

  const submit = async () => {
    const dto = form.buildDto();
    if (!dto) return;
    try {
      if (form.mode === 'edit' && form.editingId) {
        await editItem(form.editingId, dto);
      } else {
        await addItem({
          ...dto,
          source: form.scannedConfidence != null ? PantryItemSource.AI : PantryItemSource.MANUAL,
        });
      }
      form.close();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save the item.');
    }
  };

  const removeCurrent = async () => {
    if (!form.editingId) return;
    try {
      await deleteItem(form.editingId);
      form.close();
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete the item.');
    }
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Pantry</Text>
      <Text style={styles.headerCount}>
        {items.length} item{items.length === 1 ? '' : 's'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {Header}
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <View style={[styles.skeletonAvatar, styles.skeleton]} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={[styles.skeleton, { height: 14, width: '55%', borderRadius: 6 }]} />
              <View style={[styles.skeleton, { height: 11, width: '30%', borderRadius: 6 }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Header}

      {showingCached && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>
            Showing cached data — connect to internet for latest
          </Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBar}>
          <Ionicons name="alert-circle-outline" size={18} color={DANGER} />
          <Text style={styles.errorText} selectable>
            {error}
          </Text>
          <Pressable onPress={reload} hitSlop={8}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(it) => it.id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30)
              .springify()
              .damping(30)}
          >
            <PantryRow item={item} onPress={() => form.openEdit(item)} />
          </Animated.View>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={
          sections.length === 0 ? styles.emptyWrap : { paddingBottom: insets.bottom + 96 }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="basket-outline" size={40} color={ACCENT} />
              </View>
              <Text style={styles.emptyTitle}>Your pantry is empty</Text>
              <Text style={styles.emptySub}>
                Add items to start tracking what you have at home.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={form.openAdd}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Add your first item</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={form.openAdd}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <PantryItemSheet form={form} onSubmit={submit} onDelete={removeCurrent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: TEXT },
  headerCount: { fontSize: 14, color: MUTED, marginTop: 2 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skeletonAvatar: { width: 46, height: 46, borderRadius: 23 },
  skeleton: { backgroundColor: '#ECECEC' },
  cacheBanner: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  cacheBannerText: { color: '#92400E', fontSize: 13, fontWeight: '500' },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  errorText: { flex: 1, color: DANGER, fontSize: 13 },
  retry: { color: DANGER, fontWeight: '700', fontSize: 13 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: ACCENT_DIM,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  emptySub: { fontSize: 14, color: MUTED, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderCurve: 'continuous',
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  },
});
