import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { pantryApi } from '@/api/pantry';
import type { ScanResult } from '@/api/types';

// Encapsulates the "Scan with AI" flow: permission → pick/take photo →
// POST /pantry-items/scan-image → hand the parsed result back to the caller.
export function useImageScan() {
  const [scanning, setScanning] = useState(false);

  const analyse = useCallback(
    async (asset: ImagePicker.ImagePickerAsset, onResult: (r: ScanResult) => void) => {
      setScanning(true);
      try {
        const r = await pantryApi.scanImage({
          uri: asset.uri,
          name: asset.fileName || 'scan.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
        onResult(r);
      } catch (e) {
        Alert.alert('Scan failed', e instanceof Error ? e.message : 'Could not analyse the photo.');
      } finally {
        setScanning(false);
      }
    },
    [],
  );

  const scan = useCallback(
    (onResult: (r: ScanResult) => void) => {
      Alert.alert('Scan with AI', 'Add a photo of the food item.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) return Alert.alert('Camera access needed', 'Enable it in Settings.');
            const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
            if (!res.canceled && res.assets[0]) analyse(res.assets[0], onResult);
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) return Alert.alert('Photo access needed', 'Enable it in Settings.');
            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
            if (!res.canceled && res.assets[0]) analyse(res.assets[0], onResult);
          },
        },
      ]);
    },
    [analyse],
  );

  return { scanning, scan };
}
