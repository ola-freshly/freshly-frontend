import { FoodCategory } from '@/api/types';
import type { PantryItem } from '@/api/types';
import { CATEGORIES, DANGER, META, type CategoryMeta } from './pantry-theme';

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const metaOf = (c?: string | null): CategoryMeta => META[c ?? 'other'] ?? META.other;

// The backend returns `category` as a plain slug string in some responses and as
// a relation object ({ id, name, slug }) after create/update — normalise both.
export const slugOf = (i: PantryItem): string => {
  const c = i.category as unknown;
  if (!c) return 'other';
  if (typeof c === 'string') return c;
  if (typeof c === 'object' && 'slug' in (c as object)) return String((c as { slug: string }).slug);
  return 'other';
};

export const asCategory = (c?: string | null): FoodCategory | undefined =>
  CATEGORIES.includes(c as FoodCategory) ? (c as FoodCategory) : undefined;

export const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function expiryInfo(date?: string | null) {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(date);
  exp.setHours(0, 0, 0, 0);
  if (Number.isNaN(exp.getTime())) return null;
  const days = Math.round((exp.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { label: 'Expired', color: DANGER, bg: '#FEF2F2' };
  if (days === 0) return { label: 'Today', color: DANGER, bg: '#FEF2F2' };
  if (days <= 7) return { label: `${days}d left`, color: '#B45309', bg: '#FEF3C7' };
  return null;
}

export type PantrySection = { title: string; data: PantryItem[] };

// Group items into one section per category, ordered to match META.
export function buildSections(items: PantryItem[]): PantrySection[] {
  const map = new Map<string, PantryItem[]>();
  for (const item of items) {
    const s = slugOf(item);
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(item);
  }
  const order = Object.keys(META);
  return [...map.keys()]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((s) => ({ title: metaOf(s).label, data: map.get(s)! }));
}
