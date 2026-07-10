import { Ionicons } from '@expo/vector-icons';

// Green + white theme (matches login / edit-profile).
export const ACCENT = '#16A34A'; // primary green (brand / buttons)
export const ACCENT_LIGHT = '#F0FDF4'; // light green tint
export const ACCENT_DIM = '#DCFCE7'; // green border/tint
export const BG = '#F0FDF4'; // light-green background
export const DANGER = '#DC2626'; // destructive red

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

// Each meal type carries its own accent, warm -> cool through the day, so
// meal types are scannable at a glance while staying within a tasteful palette.
export const MEALS: {
  type: MealType;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: 'breakfast', label: 'Breakfast', color: '#F59E0B', icon: 'sunny-outline' }, // amber
  { type: 'lunch', label: 'Lunch', color: ACCENT, icon: 'partly-sunny-outline' }, // green
  { type: 'snack', label: 'Snack', color: '#0D9488', icon: 'nutrition-outline' }, // teal
  { type: 'dinner', label: 'Dinner', color: '#6366F1', icon: 'moon-outline' }, // indigo
];
