import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { tapLight } from '@/utils/haptics';

import { ACCENT, ACCENT_DIM, ACCENT_LIGHT, MEALS } from './theme';

export default function AddMealChooserScreen() {
  const { mealType, date } = useLocalSearchParams<{ mealType?: string; date?: string }>();

  const meal = MEALS.find((m) => m.type === mealType);

  const subtitle = (() => {
    if (!meal || !date) return 'Add a dish to your plan';
    const label = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    return `${meal.label} · ${label}`;
  })();

  const go = (pathname: '/pick-recipe' | '/meal-plan-generate') => {
    if (!mealType || !date) return;
    tapLight();
    router.push({ pathname, params: { mealType, date } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add a meal</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => go('/pick-recipe')}>
        <View style={styles.cardIcon}>
          <Ionicons name="book-outline" size={24} color={ACCENT} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Choose a recipe</Text>
          <Text style={styles.cardSub}>Pick from your saved recipes</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => go('/meal-plan-generate')}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="sparkles" size={22} color={ACCENT} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Generate with AI</Text>
          <Text style={styles.cardSub}>Create a new recipe from your pantry</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, gap: 14 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 8 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: ACCENT_DIM,
    backgroundColor: ACCENT_LIGHT,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280' },
});
