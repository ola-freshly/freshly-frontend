import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, MealType } from './theme';
import { plannerStore } from './store';

type Suggestion = { title: string; description: string; cookTime: number; calories: number };

// --- MOCK DATA (replace with API later) ---
const MOCK_SUGGESTIONS: Suggestion[] = [
  { title: 'Grilled Chicken Salad', description: 'Fresh greens, grilled chicken and a light olive-oil dressing.', cookTime: 25, calories: 450 },
  { title: 'Shrimp Tom Yum Soup', description: 'Spicy-sour Thai soup with shrimp, lemongrass and lime.', cookTime: 35, calories: 520 },
  { title: 'Veggie Stir-Fry with Rice', description: 'Quick pantry stir-fry served over steamed rice.', cookTime: 25, calories: 480 },
  { title: 'Salmon Poke Bowl', description: 'Rice bowl with salmon, avocado and cucumber.', cookTime: 20, calories: 510 },
];

export default function MealSuggestionModal() {
  const { mealType, date } = useLocalSearchParams<{ mealType?: string; date?: string }>();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [added, setAdded] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestion = MOCK_SUGGESTIONS[index % MOCK_SUGGESTIONS.length];

  const addDish = () => {
    if (!date || !mealType) return;
    plannerStore.add(date, mealType as MealType, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: suggestion.title,
      cookTime: suggestion.cookTime,
      calories: suggestion.calories,
    });
    setAdded((a) => a + 1);
    setJustAdded(suggestion.title); // confirm what was added before advancing
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setJustAdded(null), 1800);
    setIndex((i) => i + 1); // show a fresh suggestion so multiple can be added
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h}>Suggested {mealType ?? 'meal'}</Text>
      <View style={styles.subRow}>
        <Ionicons name="sparkles" size={13} color={ACCENT} />
        <Text style={styles.sub}>Generated from your pantry ingredients</Text>
      </View>

      <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
        {justAdded && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
            <Text style={styles.toastT} numberOfLines={1}>
              Added “{justAdded}” to {mealType ?? 'meal'}
            </Text>
          </View>
        )}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.thumb}>
              <Ionicons name="restaurant-outline" size={26} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{suggestion.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color="#888" />
                <Text style={styles.meta}>{suggestion.cookTime} min</Text>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="flame-outline" size={13} color="#888" />
                <Text style={styles.meta}>{suggestion.calories} kcal</Text>
              </View>
            </View>
          </View>
          <Text style={styles.desc}>{suggestion.description}</Text>
        </View>
      </ScrollView>

      <View style={{ gap: 10 }}>
        <Pressable style={styles.secondary} onPress={() => setIndex((i) => i + 1)}>
          <Ionicons name="shuffle" size={18} color="#333" />
          <Text style={styles.secondaryT}>Generate another</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={addDish}>
          <Text style={styles.primaryT}>Add dish{added > 0 ? `  ·  ${added} added` : ''}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, gap: 8 },
  h: { fontSize: 22, fontWeight: '700', color: '#111', textTransform: 'capitalize' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sub: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ACCENT + '14',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toastT: { flex: 1, fontSize: 13, color: ACCENT, fontWeight: '600' },
  card: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 13, color: '#888' },
  metaDot: { fontSize: 13, color: '#CCC', marginHorizontal: 2 },
  desc: { fontSize: 14, color: '#555', lineHeight: 20 },
  primary: { backgroundColor: ACCENT, borderRadius: 12, padding: 15, alignItems: 'center' },
  primaryT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryT: { color: '#333', fontWeight: '600' },
  done: { textAlign: 'center', color: '#555', fontWeight: '600', paddingVertical: 10 },
});
