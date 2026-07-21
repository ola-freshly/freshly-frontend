import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Shared centered empty state with an icon, copy, and an optional CTA. Content
// is prop-driven so each screen supplies its own wording — no variant flags.
export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={40} color={ACCENT} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.btn} onPress={onAction}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  icon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
