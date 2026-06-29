import { View, Text, StyleSheet } from 'react-native';

export default function ScanBarcodeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Barcode Scanner</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#333' },
});
