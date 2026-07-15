import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { pantryApi } from '@/api/pantry';
import { FoodCategory, PantryItemSource } from '@/api/types';
import type { PantryItem } from '@/api/types';
import { pantryCache } from '@/utils/pantryCache';

const ACCENT = '#16A34A';
const ACCENT_LIGHT = '#F0FDF4';
const ACCENT_DIM = '#DCFCE7';
const BORDER = '#E5E7EB';
const MUTED = '#6B7280';
const TEXT = '#111827';
const DANGER = '#DC2626';

type Meta = { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string };

// Keyed by FoodCategory *values* (the backend slugs), so it's robust to enum names.
const META: Record<string, Meta> = {
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

const CATEGORIES = Object.values(FoodCategory) as FoodCategory[];
const DEFAULT_CAT = (CATEGORIES.find((c) => c === 'other') ??
  CATEGORIES[CATEGORIES.length - 1]) as FoodCategory;
const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'can', 'pk', 'oz', 'lb', 'teaspoon', 'tablespoon'];

const metaOf = (c?: string | null): Meta => META[c ?? 'other'] ?? META.other;
const slugOf = (i: PantryItem): string => (i.category as string | undefined) ?? 'other';
const asCategory = (c?: string | null): FoodCategory | undefined =>
  CATEGORIES.includes(c as FoodCategory) ? (c as FoodCategory) : undefined;
const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function expiryInfo(date?: string | null) {
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

type Section = { slug: string; title: string; data: PantryItem[] };
type SheetMode = 'add' | 'edit' | null;
export default function PantryScreen(){

}