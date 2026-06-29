import { View, Text, StyleSheet } from 'react-native';

export default function ScanImageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Image Recognition</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#333' },
});
