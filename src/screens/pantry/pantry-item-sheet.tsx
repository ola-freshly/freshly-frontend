import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QuantityWheel } from './quantity-wheel';
import { useImageScan } from './use-image-scan';
import type { PantryForm } from './use-pantry-form';
import { metaOf } from './pantry-utils';
import {
  ACCENT,
  ACCENT_DIM,
  ACCENT_LIGHT,
  BORDER,
  CATEGORIES,
  DANGER,
  MUTED,
  TEXT,
  UNITS,
} from './pantry-theme';

type Props = {
  form: PantryForm;
  onSubmit: () => Promise<void>; // caller handles add-vs-edit + closing
  onDelete: () => Promise<void>;
};

export function PantryItemSheet({ form, onSubmit, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const { scanning, scan } = useImageScan();
  const [saving, setSaving] = useState(false);

  const {
    mode,
    step,
    name,
    quantity,
    unit,
    category,
    expiry,
    usage,
    scannedConfidence,
    setName,
    setQuantity,
    setUnit,
    setCategory,
    setExpiry,
    setUsage,
    setStep,
    close,
    applyScan,
    goNext,
  } = form;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete item?', `“${name}” will be removed from your pantry.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={close} />
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
                <Pressable
                  style={styles.scanBtn}
                  onPress={() => scan(applyScan)}
                  disabled={scanning}
                >
                  <Ionicons name="sparkles" size={16} color={ACCENT} />
                  <Text style={styles.scanText}>
                    {scanning ? 'Analysing photo…' : 'Scan with AI'}
                  </Text>
                </Pressable>
                {scannedConfidence != null && (
                  <Text style={styles.confidence}>
                    AI filled these fields · {Math.round(scannedConfidence * 100)}% confident —
                    review before saving
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
                    <Pressable style={styles.trashBtn} onPress={confirmDelete}>
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
                <Text style={styles.quantityLabel}>How much {name.trim() || 'do you have'}?</Text>
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
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveText}>
                        {mode === 'edit' ? 'Save changes' : 'Add to pantry'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  quantityLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 8,
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
