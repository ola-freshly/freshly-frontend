import { View, Text, StyleSheet } from 'react-native';

export default function NutritionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>This Week</Text>
      <Text style={styles.empty}>
        No nutrition data yet. Start tracking meals to see your weekly report.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '600', color: '#333', marginBottom: 16 },
  empty: { color: '#999', fontSize: 15, textAlign: 'center', marginTop: 48 },
});
