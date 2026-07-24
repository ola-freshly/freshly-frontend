import { useCallback, useMemo, useState } from 'react';
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
import { EmptyState } from '@/components/EmptyState';
import { ErrorBar } from '@/components/ErrorBar';
import { getErrorMessage } from '@/utils/apiError';
import { PantryItemSource } from '@/api/types';
import { usePantry } from '@/screens/pantry/use-pantry';
import { usePantryForm } from '@/screens/pantry/use-pantry-form';
import { PantryRow } from '@/screens/pantry/pantry-row';
import { PantryItemSheet } from '@/screens/pantry/pantry-item-sheet';
import { PantryMergeModal } from '@/screens/pantry/pantry-merge-modal';
import { buildSections } from '@/screens/pantry/pantry-utils';
import { ACCENT, ACCENT_LIGHT, MUTED, TEXT } from '@/screens/pantry/pantry-theme';

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
    mergeItems,
  } = usePantry();
  const form = usePantryForm();

  // Multi-select + merge state.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [merging, setMerging] = useState(false);

  // Reload on focus so the list re-mounts each visit — this both keeps the
  // pantry fresh and replays the row entrance animation, matching RecipesScreen.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const sections = useMemo(() => buildSections(items), [items]);
  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  const enterSelect = (id: string) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const doMerge = async (payload: { primaryId: string; expiryDate?: string | null }) => {
    setMerging(true);
    try {
      await mergeItems({ itemIds: [...selectedIds], ...payload });
      setMergeOpen(false);
      cancelSelect();
    } catch (e) {
      Alert.alert('Merge failed', getErrorMessage(e, 'Could not merge the items.'));
    } finally {
      setMerging(false);
    }
  };

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
      Alert.alert('Save failed', getErrorMessage(e, 'Could not save the item.'));
    }
  };

  const removeCurrent = async () => {
    if (!form.editingId) return;
    try {
      await deleteItem(form.editingId);
      form.close();
    } catch (e) {
      Alert.alert('Delete failed', getErrorMessage(e, 'Could not delete the item.'));
    }
  };

  const Header = selectMode ? (
    <View style={[styles.header, styles.selectHeader, { paddingTop: insets.top }]}>
      <Pressable onPress={cancelSelect} hitSlop={10}>
        <Text style={styles.selectAction}>Cancel</Text>
      </Pressable>
      <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
      <Pressable onPress={() => setMergeOpen(true)} disabled={selectedIds.size < 2} hitSlop={10}>
        <Text style={[styles.selectAction, selectedIds.size < 2 && styles.selectActionDisabled]}>
          Merge
        </Text>
      </Pressable>
    </View>
  ) : (
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
      {error && <ErrorBar message={error} onRetry={reload} />}

      <SectionList
        sections={sections}
        keyExtractor={(it) => it.id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30)
              .springify()
              .damping(30)}
          >
            <PantryRow
              item={item}
              selectable={selectMode}
              selected={selectedIds.has(item.id)}
              onPress={() => (selectMode ? toggleSelect(item.id) : form.openEdit(item))}
              onLongPress={() => enterSelect(item.id)}
            />
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
            <EmptyState
              icon="basket-outline"
              title="Your pantry is empty"
              subtitle="Add items to start tracking what you have at home."
              actionLabel="Add your first item"
              onAction={form.openAdd}
            />
          ) : null
        }
      />

      {!selectMode && (
        <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={form.openAdd}>
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      )}

      <PantryItemSheet form={form} onSubmit={submit} onDelete={removeCurrent} />

      <PantryMergeModal
        key={selectedItems.map((i) => i.id).join(',')}
        visible={mergeOpen}
        items={selectedItems}
        submitting={merging}
        onCancel={() => setMergeOpen(false)}
        onConfirm={doMerge}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: TEXT },
  headerCount: { fontSize: 14, color: MUTED, marginTop: 2 },
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectCount: { fontSize: 16, fontWeight: '700', color: TEXT },
  selectAction: { fontSize: 16, fontWeight: '600', color: ACCENT },
  selectActionDisabled: { color: '#C4C4C4' },
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
  // The list centers the shared <EmptyState /> via this container.
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
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
