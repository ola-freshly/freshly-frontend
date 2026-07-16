import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { pantryApi } from '@/api/pantry';
import { FoodCategory, PantryItemSource } from '@/api/types';
import type { PantryItem } from '@/api/types';
import { usePantry } from '@/screens/pantry/use-pantry';
import { QuantityWheel } from '@/screens/pantry/quantity-wheel';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';
const ACCENT_DIM = '#DCFCE7';
const BORDER = '#E5E7EB';
const MUTED = '#6B7280';
const TEXT = '#111827';
const DANGER = '#DC2626';

type Meta = { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string };

// Keyed by FoodCategory *values* (the backend slugs), so it's robust to enum names.
const META: Record<string, Meta> = {
  dairy: { label: 'Dairy & eggs', icon: 'egg-outline', tint: '#F59E0B' },
  vegetable: { label: 'Vegetables', icon: 'leaf-outline', tint: '#16A34A' },
  fruit: { label: 'Fruits', icon: 'nutrition-outline', tint: '#EF4444' },
  meat: { label: 'Meat', icon: 'restaurant-outline', tint: '#B91C1C' },
  seafood: { label: 'Seafood', icon: 'fish-outline', tint: '#0EA5E9' },
  grain: { label: 'Grains', icon: 'flower-outline', tint: '#D97706' },
  spice: { label: 'Spices', icon: 'flame-outline', tint: '#EA580C' },
  beverage: { label: 'Beverages', icon: 'cafe-outline', tint: '#0D9488' },
  snack: { label: 'Snacks', icon: 'fast-food-outline', tint: '#9333EA' },
  condiment: { label: 'Condiments', icon: 'water-outline', tint: '#CA8A04' },
  other: { label: 'Other', icon: 'cube-outline', tint: '#64748B' },
};

const CATEGORIES = Object.values(FoodCategory) as FoodCategory[];
const DEFAULT_CAT = (CATEGORIES.find((c) => c === 'other') ??
  CATEGORIES[CATEGORIES.length - 1]) as FoodCategory;
const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'can', 'pk', 'oz', 'lb', 'teaspoon', 'tablespoon'];

const metaOf = (c?: string | null): Meta => META[c ?? 'other'] ?? META.other;
// The backend returns `category` as a plain slug string in some responses and as
// a relation object ({ id, name, slug }) after create/update — normalise both.
const slugOf = (i: PantryItem): string => {
  const c = i.category as unknown;
  if (!c) return 'other';
  if (typeof c === 'string') return c;
  if (typeof c === 'object' && 'slug' in (c as object)) return String((c as { slug: string }).slug);
  return 'other';
};
const asCategory = (c?: string | null): FoodCategory | undefined =>
  CATEGORIES.includes(c as FoodCategory) ? (c as FoodCategory) : undefined;
const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function expiryInfo(date?: string | null) {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(date);
  exp.setHours(0, 0, 0, 0);
  if (Number.isNaN(exp.getTime())) return null;
  const days = Math.round((exp.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { label: 'Expired', color: DANGER, bg: '#FEF2F2' };
  if (days === 0) return { label: 'Today', color: DANGER, bg: '#FEF2F2' };
  if (days <= 7) return { label: `${days}d left`, color: '#B45309', bg: '#FEF3C7' };
  return null;
}

type SheetMode = 'add' | 'edit' | null;

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

  const [mode, setMode] = useState<SheetMode>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState<FoodCategory>(DEFAULT_CAT);
  const [expiry, setExpiry] = useState('');
  const [usage, setUsage] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedConfidence, setScannedConfidence] = useState<number | null>(null);

  const sections = useMemo(() => {
    const map = new Map<string, PantryItem[]>();
    for (const item of items) {
      const s = slugOf(item);
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(item);
    }
    const order = Object.keys(META);
    return [...map.keys()]
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map((s) => ({ title: metaOf(s).label, data: map.get(s)! }));
  }, [items]);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setQuantity('1');
    setUnit('pcs');
    setCategory(DEFAULT_CAT);
    setExpiry('');
    setUsage('');
    setScannedConfidence(null);
    setStep(1);
    setMode('add');
  };
  const openEdit = (it: PantryItem) => {
    setEditingId(it.id);
    setName(it.name);
    setQuantity(fmtQty(Number(it.quantity)));
    setUnit(it.unit);
    setCategory(asCategory(slugOf(it)) ?? DEFAULT_CAT);
    setExpiry(it.expiryDate ? it.expiryDate.slice(0, 10) : '');
    setUsage(it.usageInstruction ?? '');
    setScannedConfidence(null);
    setStep(1);
    setMode('edit');
  };
  const closeSheet = () => setMode(null);

  // Step 1 → Step 2. Validate the fields captured on the first screen.
  const goNext = () => {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter an item name.');
    if (expiry && !ISO_DATE.test(expiry)) return Alert.alert('Invalid date', 'Use format YYYY-MM-DD.');
    setStep(2);
  };

  const runScan = async (asset: ImagePicker.ImagePickerAsset) => {
    setScanning(true);
    try {
      const r = await pantryApi.scanImage({
        uri: asset.uri,
        name: asset.fileName || 'scan.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      setName(r.name || '');
      setCategory(asCategory(r.category) ?? DEFAULT_CAT);
      if (r.expirationDate && ISO_DATE.test(r.expirationDate.slice(0, 10)))
        setExpiry(r.expirationDate.slice(0, 10));
      if (r.usageInstruction) setUsage(r.usageInstruction);
      setScannedConfidence(r.confidence);
    } catch (e) {
      Alert.alert('Scan failed', e instanceof Error ? e.message : 'Could not analyse the photo.');
    } finally {
      setScanning(false);
    }
  };

  const scanWithAI = () => {
    Alert.alert('Scan with AI', 'Add a photo of the food item.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return Alert.alert('Camera access needed', 'Enable it in Settings.');
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!res.canceled && res.assets[0]) runScan(res.assets[0]);
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return Alert.alert('Photo access needed', 'Enable it in Settings.');
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!res.canceled && res.assets[0]) runScan(res.assets[0]);
        },
      },
    ]);
  };

  const save = async () => {
    const trimmed = name.trim();
    const qty = Number(quantity);
    if (!trimmed) return Alert.alert('Name required', 'Please enter an item name.');
    if (!Number.isFinite(qty) || qty < 0) return Alert.alert('Invalid quantity', 'Enter a valid number.');
    if (expiry && !ISO_DATE.test(expiry)) return Alert.alert('Invalid date', 'Use format YYYY-MM-DD.');

    const dto = {
      name: trimmed,
      quantity: qty,
      unit: unit.trim() || 'pcs',
      category,
      expiryDate: expiry || undefined,
      usageInstruction: usage.trim() || undefined,
    };

    setSaving(true);
    try {
      if (mode === 'edit' && editingId) {
        await editItem(editingId, dto);
      } else {
        await addItem({
          ...dto,
          source: scannedConfidence != null ? PantryItemSource.AI : PantryItemSource.MANUAL,
        });
      }
      closeSheet();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save the item.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert('Delete item?', `“${name}” will be removed from your pantry.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(editingId);
            closeSheet();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete the item.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PantryItem }) => {
    const meta = metaOf(slugOf(item));
    const exp = expiryInfo(item.expiryDate);
    return (
      <Pressable style={styles.row} onPress={() => openEdit(item)}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: ACCENT_DIM }]}>
            <Ionicons name={meta.icon} size={22} color={meta.tint} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          <Text style={styles.rowSub}>
            {fmtQty(Number(item.quantity))} {item.unit}
          </Text>
        </View>
        {exp && (
          <View style={[styles.expBadge, { backgroundColor: exp.bg }]}>
            <Text style={[styles.expText, { color: exp.color }]}>{exp.label}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
      </Pressable>
    );
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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
          <View key={i} style={styles.row}>
            <View style={[styles.avatar, styles.skeleton]} />
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
          <Text style={styles.cacheBannerText}>Showing cached data — connect to internet for latest</Text>
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
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={
          sections.length === 0 ? styles.emptyWrap : { paddingBottom: insets.bottom + 96 }
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="basket-outline" size={40} color={ACCENT} />
              </View>
              <Text style={styles.emptyTitle}>Your pantry is empty</Text>
              <Text style={styles.emptySub}>Add items to start tracking what you have at home.</Text>
              <Pressable style={styles.emptyBtn} onPress={openAdd}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Add your first item</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={openAdd}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />

              <View style={styles.sheetHeader}>
                {step === 2 ? (
                  <Pressable onPress={() => setStep(1)} hitSlop={10} style={styles.sheetHeaderBtn}>
                    <Ionicons name="chevron-back" size={24} color={TEXT} />
                  </Pressable>
                ) : (
                  <View style={styles.sheetHeaderBtn} />
                )}
                <Text style={styles.sheetTitle}>
                  {mode === 'edit' ? 'Edit item' : 'New item'} · Step {step} of 2
                </Text>
                <View style={styles.sheetHeaderBtn} />
              </View>

              <View style={styles.sheetImageCircle}>
                {scanning ? (
                  <ActivityIndicator color={ACCENT} />
                ) : (
                  <Ionicons name={metaOf(category).icon} size={44} color={metaOf(category).tint} />
                )}
              </View>

              {step === 1 ? (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <Pressable style={styles.scanBtn} onPress={scanWithAI} disabled={scanning}>
                    <Ionicons name="sparkles" size={16} color={ACCENT} />
                    <Text style={styles.scanText}>{scanning ? 'Analysing photo…' : 'Scan with AI'}</Text>
                  </Pressable>
                  {scannedConfidence != null && (
                    <Text style={styles.confidence}>
                      AI filled these fields · {Math.round(scannedConfidence * 100)}% confident — review before saving
                    </Text>
                  )}

                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Milk"
                    placeholderTextColor="#9CA3AF"
                  />

                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chipWrap}>
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setCategory(c)}
                        style={[styles.chip, category === c && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                          {metaOf(c).label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>Expiry date (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                  />

                  <Text style={styles.label}>Comment (optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                    value={usage}
                    onChangeText={setUsage}
                    placeholder="Notes, usage, storage…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />

                  <View style={styles.sheetActions}>
                    {mode === 'edit' && (
                      <Pressable style={styles.trashBtn} onPress={remove}>
                        <Ionicons name="trash-outline" size={22} color={DANGER} />
                      </Pressable>
                    )}
                    <Pressable style={styles.saveBtn} onPress={goNext}>
                      <Text style={styles.saveText}>Next</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              ) : (
                <View>
                  <Text style={styles.quantityLabel}>
                    How much {name.trim() || 'do you have'}?
                  </Text>
                  <QuantityWheel
                    value={Number(quantity) || 0}
                    unit={unit}
                    units={UNITS}
                    onChange={(v, u) => {
                      setQuantity(String(v));
                      setUnit(u);
                    }}
                  />
                  <View style={[styles.sheetActions, { marginTop: 20 }]}>
                    <Pressable
                      style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                      onPress={save}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.saveText}>{mode === 'edit' ? 'Save changes' : 'Add to pantry'}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: TEXT },
  rowSub: { fontSize: 13, color: MUTED, marginTop: 2 },
  expBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  expText: { fontSize: 11, fontWeight: '700' },
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sheetHeaderBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 14, fontWeight: '600', color: MUTED },
  quantityLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 8,
  },
  sheetImageCircle: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ACCENT_DIM,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  scanBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: ACCENT_LIGHT,
  },
  scanText: { color: ACCENT, fontWeight: '600', fontSize: 14 },
  confidence: { textAlign: 'center', color: MUTED, fontSize: 12, marginTop: 8 },
  label: { fontSize: 13, fontWeight: '600', color: MUTED, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: ACCENT_DIM, borderColor: ACCENT },
  chipText: { fontSize: 13, color: MUTED },
  chipTextActive: { color: ACCENT, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  trashBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderCurve: 'continuous',
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});