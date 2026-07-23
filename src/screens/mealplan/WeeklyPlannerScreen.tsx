import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBar } from '@/components/ErrorBar';
import { MEALS, ACCENT, BG } from './theme';
import { plannerStore, usePlannerVersion, startOfWeek, addDays, iso, usePlannerStatus } from './store';

const DAYS_IN_WEEK = 7;

export default function WeeklyPlannerScreen() {
  const router = useRouter();
  usePlannerVersion(); // re-render when dishes are added/removed
  const [weekOffset, setWeekOffset] = useState(0);
  // Memoize so weekStart keeps a stable reference per weekOffset — otherwise the
  // useFocusEffect callback below changes every render and refetches in a loop.
  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date()), weekOffset * 7),
    [weekOffset],
  );
  const days = Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(weekStart, i));
  const { loading, error } = usePlannerStatus();

  // One persistent animated value per day card (0 = hidden, 1 = settled). Held in
  // a ref so they survive re-renders — this lets us replay the entrance on every
  // focus WITHOUT remounting the cards (which would rebuild every dish inside).
  const anims = useRef(
    Array.from({ length: DAYS_IN_WEEK }, () => new Animated.Value(0)),
  ).current;

  const runEntrance = useCallback(() => {
    anims.forEach((v) => v.setValue(0));
    Animated.stagger(
      60,
      anims.map((v) =>
        Animated.spring(v, {
          toValue: 1,
          friction: 2,
          tension: 60,
          useNativeDriver: true, // opacity + transform run on the native thread
        }),
      ),
    ).start();
  }, [anims]);

  // Runs on mount, on week change (weekStart dep), and whenever the screen
  // regains focus (e.g. returning from the add-meal modal).
  useFocusEffect(
    useCallback(() => {
      runEntrance();
      void plannerStore.loadWeek(weekStart);
    }, [weekStart, runEntrance]),
  );

  const kcalOf = (dayIso: string) =>
    MEALS.reduce(
      (s, m) => s + plannerStore.get(dayIso, m.type).reduce((a, d) => a + d.calories, 0),
      0,
    );
  const weekKcal = days.reduce((sum, day) => sum + kcalOf(iso(day)), 0);

  // Full-screen loader on the initial fetch (before any data), so we never show
  // a half-populated screen. A background refresh of a loaded week keeps the UI.
  if (loading && weekKcal === 0 && !error) {
    return (
      <View style={styles.fullLoader}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

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
            {addDays(weekStart, 6).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
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

      {error ? (
        <ErrorBar message={error} onRetry={() => void plannerStore.loadWeek(weekStart)} />
      ) : null}

      {loading && <ActivityIndicator color={ACCENT} style={styles.loader} />}

      {weekKcal === 0 && !loading && !error && (
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

      {days.map((day, index) => {
        const dayIso = iso(day);
        const dayKcal = kcalOf(dayIso);
        const openAdd = (mealType: string) =>
          router.push({ pathname: '/(app)/meal-suggestion', params: { mealType, date: dayIso } });
        const filled = MEALS.filter((m) => plannerStore.get(dayIso, m.type).length > 0);
        const emptyMeals = MEALS.filter((m) => plannerStore.get(dayIso, m.type).length === 0);
        return (
          <Animated.View
            key={dayIso}
            style={[
              styles.dayCard,
              {
                opacity: anims[index],
                transform: [
                  {
                    translateY: anims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0], // slide up as it fades in
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.dayHead}>
              <Text style={styles.dayTitle}>
                {day.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
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
                      // Skip navigation until the dish has a real recipeId — a
                      // freshly-added dish has an empty one until the DB refetch.
                      disabled={!dish.recipeId}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/meal-detail',
                          params: { id: dish.id, date: dayIso, mealType: meal.type, recipeId: dish.recipeId },
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
          </Animated.View>
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
  loader: { marginVertical: 20 },
  fullLoader: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
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
  dishIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishName: { fontSize: 14, fontWeight: '600', color: '#222' },
  dishMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  kcal: { fontSize: 14, fontWeight: '700', color: '#333' },
  kcalUnit: { fontSize: 10, color: '#999', fontWeight: '400' },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 2,
  },
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
