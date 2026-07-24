import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PantryItem } from '@/api/types';
import { ACCENT, ACCENT_DIM, BORDER, MUTED, TEXT } from './pantry-theme';
import { expiryInfo, fmtQty, metaOf, slugOf } from './pantry-utils';

export function PantryRow({
  item,
  onPress,
  onLongPress,
  selectable = false,
  selected = false,
}: {
  item: PantryItem;
  onPress: () => void;
  onLongPress?: () => void;
  selectable?: boolean;
  selected?: boolean;
}) {
  const meta = metaOf(slugOf(item));
  const exp = expiryInfo(item.expiryDate);
  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: ACCENT_DIM }]}>
          <Ionicons name={meta.icon} size={22} color={meta.tint} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowSub}>
          {fmtQty(Number(item.quantity))} {item.unit}
        </Text>
      </View>
      {exp && (
        <View style={[styles.expBadge, { backgroundColor: exp.bg }]}>
          <Text style={[styles.expText, { color: exp.color }]}>{exp.label}</Text>
        </View>
      )}
      {selectable ? (
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={selected ? ACCENT : '#C4C4C4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowSelected: { backgroundColor: ACCENT_DIM },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: TEXT },
  rowSub: { fontSize: 13, color: MUTED, marginTop: 2 },
  expBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  expText: { fontSize: 11, fontWeight: '700' },
});
