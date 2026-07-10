import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { pantryApi } from '@/api/pantry';
import type { PantryItem } from '@/api/types';
import { showToastError, showToastSuccess } from '@/utils/toast';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<PantryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pantryApi.getById(id);
        setItem(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load item';
        setError(message);
        showToastError(message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const startEditing = () => {
    if (!item) return;
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
    setEditExpiry(item.expiryDate ?? '');
    setEditInstruction(item.usageInstruction ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!item || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await pantryApi.update(item.id, {
        name: editName.trim(),
        quantity: Number(editQty),
        unit: editUnit.trim(),
        expiryDate: editExpiry.trim() || undefined,
        usageInstruction: editInstruction.trim() || undefined,
      });
      setItem(updated);
      setEditing(false);
      showToastSuccess('Item updated');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Update failed';
      showToastError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert('Delete Item', `Remove "${item.name}" from pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await pantryApi.remove(item.id);
            showToastSuccess('Item deleted');
            router.back();
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Delete failed';
            showToastError(message);
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Item not found'}</Text>
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>Edit Item</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

        <View style={styles.formRow}>
          <View style={styles.half}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Unit</Text>
            <TextInput style={styles.input} value={editUnit} onChangeText={setEditUnit} />
          </View>
        </View>

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
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{item.name}</Text>

      <View style={styles.card}>
        <Row label="Quantity" value={`${item.quantity} ${item.unit}`} />
        <Row label="Category" value={item.category ?? '—'} />
        <Row label="Source" value={item.source} />
        {item.expiryDate && (
          <Row label="Expiry" value={new Date(item.expiryDate).toLocaleDateString()} />
        )}
        {item.usageInstruction && <Row label="Instructions" value={item.usageInstruction} />}
        {item.barcode && <Row label="Barcode" value={item.barcode} />}
        {item.aiConfidence != null && (
          <Row label="AI Confidence" value={`${Math.round(item.aiConfidence * 100)}%`} />
        )}
        <Row label="Added" value={new Date(item.createdAt).toLocaleDateString()} />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={startEditing}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text style={styles.deleteBtnText}>Delete</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  name: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 20 },

  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6, marginTop: 14 },
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  half: { flex: 1 },
  formRow: { flexDirection: 'row', gap: 12 },

  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  rowLabel: { fontSize: 14, fontWeight: '500', color: '#666' },
  rowValue: { fontSize: 14, color: '#333', maxWidth: '60%', textAlign: 'right' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#208AEF',
    alignItems: 'center',
  },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },

  btn: {
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: '#208AEF', fontSize: 14, fontWeight: '500' },

  btnOutline: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#208AEF',
  },
  btnOutlineText: { color: '#208AEF', fontSize: 14, fontWeight: '600' },

  errorText: { color: '#ef4444', fontSize: 15, marginBottom: 12, textAlign: 'center' },
});
