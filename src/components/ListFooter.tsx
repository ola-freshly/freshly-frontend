import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { tapLight } from '@/utils/haptics';
import { ACCENT } from '@/screens/mealplan/theme';

type Props = {
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  itemCount: number;
  onRetry: () => void;
};

export function ListFooter({ loadingMore, hasMore, error, itemCount, onRetry }: Props) {
  if (loadingMore) {
    return (
      <View style={styles.wrap} testID="list-footer-loading">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (error && itemCount > 0) {
    return (
      <TouchableOpacity
        style={styles.wrap}
        activeOpacity={0.7}
        testID="list-footer-retry"
        onPress={() => {
          tapLight();
          onRetry();
        }}
      >
        <Text style={styles.retryText}>Couldn&apos;t load more. Tap to retry.</Text>
      </TouchableOpacity>
    );
  }

  if (!hasMore && itemCount > 0) {
    return (
      <View style={styles.wrap} testID="list-footer-end">
        <Text style={styles.endText}>That&apos;s everything</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, alignItems: 'center' },
  retryText: { color: ACCENT, fontSize: 13, fontWeight: '600' },
  endText: { color: '#6B7280', fontSize: 13 },
});
