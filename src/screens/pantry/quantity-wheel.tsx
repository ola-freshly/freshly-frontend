import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

// A dependency-free iOS-style wheel picker built on snap-scrolling ScrollViews.
// Three columns compose the quantity: whole number · decimal (tenths) · unit.
// e.g. whole 3 + decimal .1 + unit "teaspoon" => 3.1 teaspoon.

const ITEM_H = 40;
const VISIBLE = 5; // odd → the middle row is the selection
const PAD = (ITEM_H * (VISIBLE - 1)) / 2;

const ACCENT_LIGHT = '#F0FDF4';
const BORDER = '#E5E7EB';
const MUTED = '#9CA3AF';
const TEXT = '#111827';

type ColumnProps = {
  data: string[];
  index: number;
  onSelect: (i: number) => void;
  align?: 'flex-start' | 'center' | 'flex-end';
  flex?: number;
};

function Column({ data, index, onSelect, align = 'center', flex = 1 }: ColumnProps) {
  const ref = useRef<ScrollView>(null);

  // Keep the scroll position aligned to the selected index (also positions on mount).
  useEffect(() => {
    const id = requestAnimationFrame(() => ref.current?.scrollTo({ y: index * ITEM_H, animated: false }));
    return () => cancelAnimationFrame(id);
  }, [index]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(i, data.length - 1));
    if (clamped !== index) onSelect(clamped);
  };

  return (
    <ScrollView
      ref={ref}
      style={{ flex }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      onMomentumScrollEnd={settle}
      onScrollEndDrag={settle}
      contentContainerStyle={{ paddingVertical: PAD }}
    >
      {data.map((d, i) => (
        <View key={`${d}-${i}`} style={{ height: ITEM_H, justifyContent: 'center', alignItems: align }}>
          <Text style={[styles.item, i === index && styles.itemActive]}>{d}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const WHOLES = Array.from({ length: 51 }, (_, i) => String(i)); // 0..50
const DECIMALS = Array.from({ length: 10 }, (_, i) => `.${i}`); // .0 .. .9

export function QuantityWheel({
  value,
  unit,
  units,
  onChange,
}: {
  value: number;
  unit: string;
  units: string[];
  onChange: (value: number, unit: string) => void;
}) {
  const whole = Math.min(50, Math.max(0, Math.floor(value)));
  const decIdx = Math.min(9, Math.max(0, Math.round((value - whole) * 10)));
  const unitIdx = Math.max(0, units.indexOf(unit));

  const compose = (w: number, d: number, u: number) =>
    onChange(Number((w + d / 10).toFixed(1)), units[u] ?? units[0]);

  return (
    <View style={styles.wheel}>
      <View style={styles.highlight} pointerEvents="none" />
      <Column data={WHOLES} index={whole} align="flex-end" onSelect={(i) => compose(i, decIdx, unitIdx)} />
      <Column data={DECIMALS} index={decIdx} align="center" onSelect={(i) => compose(whole, i, unitIdx)} />
      <Column data={units} index={unitIdx} flex={1.6} align="flex-start" onSelect={(i) => compose(whole, decIdx, i)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    height: ITEM_H * VISIBLE,
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
  },
  highlight: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: ITEM_H * 2,
    height: ITEM_H,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    backgroundColor: ACCENT_LIGHT,
  },
  item: { fontSize: 20, color: MUTED },
  itemActive: { color: TEXT, fontWeight: '700' },
});
