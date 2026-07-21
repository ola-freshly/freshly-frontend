import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DANGER = '#DC2626';

// Shared inline error strip with a Retry action, used by list screens.
export function ErrorBar({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.bar}>
      <Ionicons name="alert-circle-outline" size={18} color={DANGER} />
      <Text style={styles.text} selectable>
        {message}
      </Text>
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={styles.retry}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  text: { flex: 1, color: DANGER, fontSize: 13 },
  retry: { color: DANGER, fontWeight: '700', fontSize: 13 },
});
