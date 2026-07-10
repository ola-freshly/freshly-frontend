import { useSyncExternalStore } from 'react';
import { MealType } from './theme';

export type PlannerDish = {
  id: string;
  title: string;
  cookTime: number;
  calories: number;
};

// --- in-memory store (mock; swap for API state later) ---
const EMPTY: PlannerDish[] = [];
const map = new Map<string, PlannerDish[]>();
const listeners = new Set<() => void>();
let version = 0;

const keyOf = (date: string, meal: MealType) => `${date}|${meal}`;
const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};

// --- date helpers (shared) ---
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-start
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// seed the current week so the planner isn't empty on first open
let seeded = false;
(function seed() {
  if (seeded) return;
  seeded = true;
  const ws = startOfWeek(new Date());
  const d = (n: number) => iso(addDays(ws, n));
  map.set(keyOf(d(0), 'breakfast'), [{ id: 's1', title: 'Greek Yogurt & Berry Bowl', cookTime: 10, calories: 320 }]);
  map.set(keyOf(d(0), 'lunch'), [{ id: 's2', title: 'Grilled Chicken Salad', cookTime: 25, calories: 450 }]);
  map.set(keyOf(d(0), 'dinner'), [{ id: 's3', title: 'Shrimp Tom Yum Soup', cookTime: 35, calories: 520 }]);
  map.set(keyOf(d(1), 'breakfast'), [{ id: 's4', title: 'Avocado Toast', cookTime: 8, calories: 290 }]);
})();

export const plannerStore = {
  get(date: string, meal: MealType): PlannerDish[] {
    return map.get(keyOf(date, meal)) ?? EMPTY;
  },
  add(date: string, meal: MealType, dish: PlannerDish) {
    const k = keyOf(date, meal);
    map.set(k, [...(map.get(k) ?? []), dish]);
    emit();
  },
  remove(date: string, meal: MealType, id: string) {
    const k = keyOf(date, meal);
    map.set(k, (map.get(k) ?? []).filter((x) => x.id !== id));
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getVersion: () => version,
};

// re-renders any component that calls it whenever the store changes
export function usePlannerVersion() {
  return useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getVersion,
    plannerStore.getVersion,
  );
}
