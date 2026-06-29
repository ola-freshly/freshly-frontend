import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddItemScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Item</Text>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>Manual Entry</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => router.push('/(app)/scan-barcode')}>
        <Text style={styles.optionText}>Scan Barcode</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => router.push('/(app)/scan-image')}>
        <Text style={styles.optionText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: '#333' },
  option: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  optionText: { fontSize: 16, color: '#333' },
});
