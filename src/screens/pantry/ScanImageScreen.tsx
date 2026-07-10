import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { pantryApi } from '@/api/pantry';
import type { ScanResult } from '@/api/types';
import { showToastError } from '@/utils/toast';
import * as ImagePicker from 'expo-image-picker';

export default function ScanImageScreen() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToastError('Permission required to access photos');
      return;
    }

    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (picker.canceled || !picker.assets[0]) return;
    await scanFile(picker.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToastError('Camera permission required');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (photo.canceled || !photo.assets[0]) return;
    await scanFile(photo.assets[0]);
  };

  const scanFile = async (asset: ImagePicker.ImagePickerAsset) => {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const data = await pantryApi.scanImage({
        uri: asset.uri,
        name: asset.fileName || 'scan.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      setResult(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Scan failed';
      setError(message);
      showToastError(message);
    } finally {
      setScanning(false);
    }
  };

  if (scanning) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.statusText}>Analyzing image…</Text>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>AI Scan Result</Text>
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
            <Text style={styles.label}>Expiry: </Text>
            {result.expirationDate ?? 'Not detected'}
          </Text>
          <Text style={styles.field}>
            <Text style={styles.label}>Instruction: </Text>
            {result.usageInstruction ?? 'N/A'}
          </Text>
          <Text style={styles.field}>
            <Text style={styles.label}>Confidence: </Text>
            {Math.round(result.confidence * 100)}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan with AI</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.btn} onPress={pickImage}>
        <Text style={styles.btnText}>Choose from Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={takePhoto}>
        <Text style={styles.btnOutlineText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 24, textAlign: 'center' },
  statusText: { marginTop: 12, fontSize: 15, color: '#666' },

  btn: {
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnOutline: {
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#208AEF',
    alignItems: 'center',
  },
  btnOutlineText: { color: '#208AEF', fontSize: 16, fontWeight: '600' },

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
