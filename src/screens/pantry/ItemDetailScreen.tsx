import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { pantryApi } from '@/api/pantry';
import type { PantryItem } from '@/api/types';
import { showToastError } from '@/utils/toast';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<PantryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowLabel: { fontSize: 14, fontWeight: '500', color: '#666' },
  rowValue: { fontSize: 14, color: '#333', maxWidth: '60%', textAlign: 'right' },

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
