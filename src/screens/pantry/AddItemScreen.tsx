import { useEffect, useMemo, useState } from 'react';
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
import { FoodCategory, PantryItemSource, type PantryUnit } from '@/api/types';
import { showToastError, showToastSuccess } from '@/utils/toast';
import { getErrorMessage } from '@/utils/apiError';
import { validatePantryItem } from '@/utils/pantryValidation';

const CATEGORIES = Object.values(FoodCategory);

interface FormState {
  name: string;
  quantity: string;
  unit: string;
  category: FoodCategory | '';
  expiryDate: string;
  usageInstruction: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  quantity: '',
  unit: '',
  category: '',
  expiryDate: '',
  usageInstruction: '',
};

export default function AddItemScreen() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unitsBySlug, setUnitsBySlug] = useState<Record<string, PantryUnit[]>>({});

  // Load the category -> allowed-units map once. If it fails, the unit field
  // gracefully falls back to free text (see availableUnits below).
  useEffect(() => {
    let active = true;
    pantryApi
      .getCategories()
      .then((categories) => {
        if (!active) return;
        const map: Record<string, PantryUnit[]> = {};
        categories.forEach((c) => {
          map[c.slug] = c.units;
        });
        setUnitsBySlug(map);
      })
      .catch(() => {
        // Non-fatal: fall back to a free-text unit input.
      });
    return () => {
      active = false;
    };
  }, []);

  const allUnits = useMemo(() => {
    const map = new Map<string, PantryUnit>();
    Object.values(unitsBySlug).forEach((units) => units.forEach((u) => map.set(u.code, u)));
    return Array.from(map.values());
  }, [unitsBySlug]);

  // Units to offer: the selected category's set, or every unit before a category
  // is chosen. Empty (e.g. categories not loaded) means the free-text fallback.
  const availableUnits = form.category ? (unitsBySlug[form.category] ?? []) : allUnits;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Selecting a category clears the unit if it's no longer valid for it.
  const selectCategory = (cat: FoodCategory) => {
    setForm((prev) => {
      const next = prev.category === cat ? '' : cat;
      const allowed = next ? (unitsBySlug[next] ?? []).map((u) => u.code) : null;
      const unit = allowed && !allowed.includes(prev.unit) ? '' : prev.unit;
      return { ...prev, category: next, unit };
    });
  };

  const validate = (): boolean => {
    const errs = validatePantryItem(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await pantryApi.create({
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        category: form.category || undefined,
        expiryDate: form.expiryDate.trim() || undefined,
        usageInstruction: form.usageInstruction.trim() || undefined,
        source: PantryItemSource.MANUAL,
      });
      showToastSuccess('Item added to pantry');
      router.back();
    } catch (e: unknown) {
      showToastError(getErrorMessage(e, 'Failed to add item'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Item</Text>

      <View style={styles.scanRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(app)/scan-barcode')}>
          <Text style={styles.scanBtnText}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(app)/scan-image')}>
          <Text style={styles.scanBtnText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Manual Entry</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => updateField('name', v)}
        placeholder="e.g. Organic Milk"
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, form.category === cat && styles.chipActive]}
            onPress={() => selectCategory(cat)}
          >
            <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Quantity *</Text>
      <TextInput
        style={styles.input}
        value={form.quantity}
        onChangeText={(v) => updateField('quantity', v)}
        placeholder="2"
        keyboardType="decimal-pad"
      />
      {errors.quantity && <Text style={styles.error}>{errors.quantity}</Text>}

      <Text style={styles.label}>Unit *</Text>
      {availableUnits.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {availableUnits.map((u) => (
            <TouchableOpacity
              key={u.code}
              style={[styles.chip, form.unit === u.code && styles.chipActive]}
              onPress={() => updateField('unit', form.unit === u.code ? '' : u.code)}
            >
              <Text style={[styles.chipText, form.unit === u.code && styles.chipTextActive]}>
                {u.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <TextInput
          style={styles.input}
          value={form.unit}
          onChangeText={(v) => updateField('unit', v)}
          placeholder="liters"
        />
      )}
      {form.category ? null : (
        <Text style={styles.hint}>Pick a category to narrow the unit options.</Text>
      )}
      {errors.unit && <Text style={styles.error}>{errors.unit}</Text>}

      <Text style={styles.label}>Expiry Date</Text>
      <TextInput
        style={styles.input}
        value={form.expiryDate}
        onChangeText={(v) => updateField('expiryDate', v)}
        placeholder="YYYY-MM-DD"
      />
      {errors.expiryDate && <Text style={styles.error}>{errors.expiryDate}</Text>}

      <Text style={styles.label}>Usage Instruction</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.usageInstruction}
        onChangeText={(v) => updateField('usageInstruction', v)}
        placeholder="e.g. Store in a cool, dry place"
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Add to Pantry</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 16 },

  scanRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  scanBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#208AEF',
    alignItems: 'center',
  },
  scanBtnText: { fontSize: 14, fontWeight: '600', color: '#208AEF' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 12 },

  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6, marginTop: 12 },
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
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

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

  error: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 6 },

  submitBtn: {
    marginTop: 28,
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
