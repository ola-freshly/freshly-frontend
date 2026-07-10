import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { pantryApi } from '@/api/pantry';
import type { ScanResult } from '@/api/types';
import { showToastError } from '@/utils/toast';

export default function ScanBarcodeScreen() {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Barcode lookup failed';
      setError(message);
      showToastError(message);
    } finally {
      setScanning(false);
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
      <View style={styles.container}>
        <Text style={styles.title}>Barcode Result</Text>
        <View style={styles.card}>
          <Text style={styles.field}>
            <Text style={styles.label}>Name: </Text>
            {result.name}
          </Text>
          <Text style={styles.field}>
            <Text style={styles.label}>Category: </Text>
            {result.category}
          </Text>
          <Text style={styles.field}>
            <Text style={styles.label}>Confidence: </Text>
            {Math.round(result.confidence * 100)}%
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={reset}>
          <Text style={styles.btnText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
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
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 24, textAlign: 'center' },
  statusText: { marginTop: 12, fontSize: 15, color: '#666' },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    fontSize: 18,
    color: '#333',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },

  btn: {
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  card: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  field: { fontSize: 15, color: '#333', marginBottom: 10 },
  label: { fontWeight: '600', color: '#555' },

  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
});
