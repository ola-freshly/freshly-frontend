import { useSyncExternalStore } from 'react';
import { MealType } from './theme';
import { mealPlansApi } from '@/api';

export type PlannerDish = {
  id: string;
  recipeId:string;
  title: string;
  cookTime: number;
  calories: number;
};

// --- in-memory store (mock; swap for API state later) ---
const EMPTY: PlannerDish[] = [];
const map = new Map<string, PlannerDish[]>();
const listeners = new Set<() => void>();
let version = 0;

let loading = false;
let error:string|null=null;

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

export const plannerStore = {
  isLoading: ()=>loading,
  isError: ()=>error,

  async loadWeek(weekStart:Date){
    const startIso=iso(weekStart);
    const endIso=iso(addDays(weekStart,6));

    loading=true;
    error=null;
    emit();

    try{
      const plans=await mealPlansApi.list();
      const inWeek=plans.filter(
        (p)=>{
          const s=String(p.startDate).slice(0,10);
          const e=String(p.endDate).slice(0,10);
          return s<=endIso && e>=startIso;
        });

      const itemsPerPlan=await Promise.all(
        inWeek.map((p)=>mealPlansApi.item(p.id)),
      );
      const items=itemsPerPlan.flat();

      for(let i=0;i<7;i++){
        const d = iso(addDays(weekStart, i));
        (['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).forEach((meal) =>
          map.delete(keyOf(d, meal)),
        );
      }

      for(const item of items){
        const d=String(item.mealDate).slice(0,10);
        if(d<startIso||d>endIso) continue;
        const meal=item.mealType.toLowerCase() as MealType;
        const k=keyOf(d, meal);
        const dish: PlannerDish={
          id:item.id,
          title: item.recipe?.title ?? "Untitled",
          cookTime: Number(item.recipe?.cookTime ?? 0),
          calories: Number(item.recipe?.calories ?? 0),
          recipeId:item.recipeId,
        };
        map.set(k,[...(map.get(k)??[]),dish])
      }
    }catch (e) {
      error =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Could not load your meal plan.';
    } finally {
      loading = false;
      emit();
    }
  },

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
    map.set(
      k,
      (map.get(k) ?? []).filter((x) => x.id !== id),
    );
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

export function usePlannerStatus() {
  usePlannerVersion();
  return {loading:plannerStore.isLoading(),error: plannerStore.isError()};
}
