import { Ionicons } from '@expo/vector-icons';
import { FoodCategory } from '@/api/types';

// green + white theme (matches mealplan/theme.ts + login)
export const ACCENT = '#16A34A';
export const ACCENT_LIGHT = '#F0FDF4';
export const ACCENT_DIM = '#DCFCE7';
export const BORDER = '#E5E7EB';
export const MUTED = '#6B7280';
export const TEXT = '#111827';
export const DANGER = '#DC2626';

export type CategoryMeta = { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string };

// Keyed by FoodCategory *values* (the backend slugs), so it's robust to enum names.
export const META: Record<string, CategoryMeta> = {
  dairy: { label: 'Dairy & eggs', icon: 'egg-outline', tint: '#F59E0B' },
  vegetable: { label: 'Vegetables', icon: 'leaf-outline', tint: '#16A34A' },
  fruit: { label: 'Fruits', icon: 'nutrition-outline', tint: '#EF4444' },
  meat: { label: 'Meat', icon: 'restaurant-outline', tint: '#B91C1C' },
  seafood: { label: 'Seafood', icon: 'fish-outline', tint: '#0EA5E9' },
  grain: { label: 'Grains', icon: 'flower-outline', tint: '#D97706' },
  spice: { label: 'Spices', icon: 'flame-outline', tint: '#EA580C' },
  beverage: { label: 'Beverages', icon: 'cafe-outline', tint: '#0D9488' },
  snack: { label: 'Snacks', icon: 'fast-food-outline', tint: '#9333EA' },
  condiment: { label: 'Condiments', icon: 'water-outline', tint: '#CA8A04' },
  other: { label: 'Other', icon: 'cube-outline', tint: '#64748B' },
};

export const CATEGORIES = Object.values(FoodCategory) as FoodCategory[];
export const DEFAULT_CAT = (CATEGORIES.find((c) => c === 'other') ??
  CATEGORIES[CATEGORIES.length - 1]) as FoodCategory;
export const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'can', 'pk', 'oz', 'lb', 'teaspoon', 'tablespoon'];
