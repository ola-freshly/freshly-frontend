import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { tapLight } from '@/utils/haptics';
import { ACCENT, MEALS, MealType } from '@/screens/mealplan/theme';

export type MealCategory = MealType | 'all';

type Props = {
  value: MealCategory;
  onChange: (next: MealCategory) => void;
};

export function MealTypeFilter({ value, onChange }: Props) {
  const chips: { key: MealCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    ...MEALS.map((m) => ({ key: m.type as MealCategory, label: m.label })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const selected = value === chip.key;
        return (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, selected && styles.chipSelected]}
            activeOpacity={0.85}
            onPress={() => {
              if (selected) return;
              tapLight();
              onChange(chip.key);
            }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{chip.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  chipTextSelected: { color: '#fff' },
});
