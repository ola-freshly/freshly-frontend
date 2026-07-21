import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { pantryApi } from '@/api/pantry';
import { FoodCategory, PantryItemSource } from '@/api/types';
import type { ScanResult } from '@/api/types';
import { showToastError, showToastSuccess } from '@/utils/toast';
import { getErrorMessage } from '@/utils/apiError';

const CATEGORIES = Object.values(FoodCategory);

export default function ScanBarcodeScreen() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<FoodCategory | ''>('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleScan = async () => {
    const code = barcode.trim();
    if (!code) {
      showToastError('Enter a barcode');
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const data = await pantryApi.scanBarcode(code);
      setResult(data);
      setEditName(data.name);
      setEditCategory((data.category as FoodCategory) || '');
      setEditExpiry(data.expirationDate ?? '');
      setEditInstruction(data.usageInstruction ?? '');
    } catch (e: unknown) {
      const message = getErrorMessage(e, 'Barcode lookup failed');
      setError(message);
      showToastError(message);
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      showToastError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      await pantryApi.create({
        name: editName.trim(),
        quantity: 1,
        unit: 'unit',
        category: editCategory || undefined,
        expiryDate: editExpiry.trim() || undefined,
        usageInstruction: editInstruction.trim() || undefined,
        source: PantryItemSource.BARCODE,
      });
      showToastSuccess('Item saved to pantry');
      router.back();
    } catch (e: unknown) {
      showToastError(getErrorMessage(e, 'Failed to save'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setBarcode('');
  };

  if (scanning) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.statusText}>Looking up barcode…</Text>
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Review & Save</Text>

        <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, editCategory === cat && styles.chipActive]}
              onPress={() => setEditCategory(editCategory === cat ? '' : cat)}
            >
              <Text style={[styles.chipText, editCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Expiry Date</Text>
        <TextInput
          style={styles.input}
          value={editExpiry}
          onChangeText={setEditExpiry}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Usage Instruction</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={editInstruction}
          onChangeText={setEditInstruction}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.btn, submitting && styles.btnDisabled]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save to Pantry</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Text style={styles.resetText}>Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Barcode</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
        placeholder="Enter barcode number"
        keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
        autoFocus
      />

      <TouchableOpacity style={styles.btn} onPress={handleScan}>
        <Text style={styles.btnText}>Look Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 8, textAlign: 'center' },
  statusText: { marginTop: 12, fontSize: 15, color: '#666' },
  confidence: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9fafb',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6, marginTop: 14 },
  chipRow: { marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  chipActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff' },

  btn: {
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resetBtn: { marginTop: 16, alignItems: 'center' },
  resetText: { color: '#208AEF', fontSize: 14, fontWeight: '500' },

  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
});
