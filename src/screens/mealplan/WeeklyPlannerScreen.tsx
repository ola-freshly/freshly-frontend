import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MEALS, ACCENT, BG } from './theme';
import { plannerStore, usePlannerVersion, startOfWeek, addDays, iso } from './store';

export default function WeeklyPlannerScreen() {
  const router = useRouter();
  usePlannerVersion(); // re-render when dishes are added/removed
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const kcalOf = (dayIso: string) =>
    MEALS.reduce(
      (s, m) => s + plannerStore.get(dayIso, m.type).reduce((a, d) => a + d.calories, 0),
      0,
    );
  const weekKcal = days.reduce((sum, day) => sum + kcalOf(iso(day)), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={styles.content}>
      {/* week navigator */}
      <View style={styles.weekBar}>
        <Pressable hitSlop={10} style={styles.navBtn} onPress={() => setWeekOffset((w) => w - 1)}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.weekRange}>
            {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
            {addDays(weekStart, 6).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
          <View style={styles.weekKcalRow}>
            <Ionicons name="flame" size={12} color={ACCENT} />
            <Text style={styles.weekKcal}>{weekKcal.toLocaleString()} kcal this week</Text>
          </View>
        </View>
        <Pressable hitSlop={10} style={styles.navBtn} onPress={() => setWeekOffset((w) => w + 1)}>
          <Ionicons name="chevron-forward" size={22} color="#333" />
        </Pressable>
      </View>

      {weekKcal === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={30} color={ACCENT} />
          </View>
          <Text style={styles.emptyTitle}>No meals planned yet</Text>
          <Text style={styles.emptyBody}>
            Tap the + on any meal below to start planning your week.
          </Text>
        </View>
      )}

      {days.map((day) => {
        const dayIso = iso(day);
        const dayKcal = kcalOf(dayIso);
        const openAdd = (mealType: string) =>
          router.push({ pathname: '/(app)/meal-suggestion', params: { mealType, date: dayIso } });
        const filled = MEALS.filter((m) => plannerStore.get(dayIso, m.type).length > 0);
        const emptyMeals = MEALS.filter((m) => plannerStore.get(dayIso, m.type).length === 0);
        return (
          <View key={dayIso} style={styles.dayCard}>
            <View style={styles.dayHead}>
              <Text style={styles.dayTitle}>
                {day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              {dayKcal > 0 && <Text style={styles.dayKcal}>{dayKcal} kcal</Text>}
            </View>

            {/* meals that already have dishes get a full row + an "add another" link */}
            {filled.map((meal) => {
              const dishes = plannerStore.get(dayIso, meal.type);
              return (
                <View key={meal.type} style={{ gap: 8 }}>
                  {dishes.map((dish) => (
                    <Pressable
                      key={dish.id}
                      style={styles.dish}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/meal-detail',
                          params: { id: dish.id, date: dayIso, mealType: meal.type },
                        })
                      }
                    >
                      <View style={[styles.dishIcon, { backgroundColor: meal.color + '22' }]}>
                        <Ionicons name={meal.icon} size={20} color={meal.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dishName} numberOfLines={1}>
                          {dish.title}
                        </Text>
                        <Text style={styles.dishMeta}>
                          {meal.label} · {dish.cookTime} min
                        </Text>
                      </View>
                      <Text style={styles.kcal}>
                        {dish.calories}
                        <Text style={styles.kcalUnit}> kcal</Text>
                      </Text>
                    </Pressable>
                  ))}

                  <Pressable style={styles.addMore} onPress={() => openAdd(meal.type)}>
                    <Ionicons name="add" size={15} color={meal.color} />
                    <Text style={[styles.addMoreT, { color: meal.color }]}>
                      Add another {meal.label.toLowerCase()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            {/* empty meals collapse into one compact chip row instead of four rows */}
            {emptyMeals.length > 0 && (
              <View style={styles.chipRow}>
                {emptyMeals.map((meal) => (
                  <Pressable
                    key={meal.type}
                    style={[styles.chip, { borderColor: meal.color + '55' }]}
                    onPress={() => openAdd(meal.type)}
                  >
                    <Ionicons name="add" size={14} color={meal.color} />
                    <Text style={[styles.chipT, { color: meal.color }]}>{meal.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRange: { fontSize: 15, fontWeight: '700', color: '#111' },
  weekKcalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  weekKcal: { fontSize: 12, color: ACCENT, fontWeight: '600' },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  emptyBody: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 19 },
  dayCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10 },
  dayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  dayKcal: { fontSize: 12, fontWeight: '700', color: ACCENT },
  dish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
  },
  dishIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dishName: { fontSize: 14, fontWeight: '600', color: '#222' },
  dishMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  kcal: { fontSize: 14, fontWeight: '700', color: '#333' },
  kcalUnit: { fontSize: 10, color: '#999', fontWeight: '400' },
  addMore: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingLeft: 2 },
  addMoreT: { fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipT: { fontSize: 13, fontWeight: '600' },
});
