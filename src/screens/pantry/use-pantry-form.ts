import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { FoodCategory } from '@/api/types';
import type { CreatePantryItemDto, PantryItem, ScanResult } from '@/api/types';
import { DEFAULT_CAT } from './pantry-theme';
import { asCategory, fmtQty, ISO_DATE, slugOf } from './pantry-utils';

export type FormMode = 'add' | 'edit' | null;

// The add/edit sheet's state machine: fields, the two-step cursor, and the
// transitions (open/close/scan/validate/build). Pure UI state — no network.
export function usePantryForm() {
  const [mode, setMode] = useState<FormMode>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState<FoodCategory>(DEFAULT_CAT);
  const [expiry, setExpiry] = useState('');
  const [usage, setUsage] = useState('');
  const [scannedConfidence, setScannedConfidence] = useState<number | null>(null);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setName('');
    setQuantity('1');
    setUnit('pcs');
    setCategory(DEFAULT_CAT);
    setExpiry('');
    setUsage('');
    setScannedConfidence(null);
    setStep(1);
    setMode('add');
  }, []);

  const openEdit = useCallback((it: PantryItem) => {
    setEditingId(it.id);
    setName(it.name);
    setQuantity(fmtQty(Number(it.quantity)));
    setUnit(it.unit);
    setCategory(asCategory(slugOf(it)) ?? DEFAULT_CAT);
    setExpiry(it.expiryDate ? it.expiryDate.slice(0, 10) : '');
    setUsage(it.usageInstruction ?? '');
    setScannedConfidence(null);
    setStep(1);
    setMode('edit');
  }, []);

  const close = useCallback(() => setMode(null), []);

  const applyScan = useCallback((r: ScanResult) => {
    setName(r.name || '');
    setCategory(asCategory(r.category) ?? DEFAULT_CAT);
    if (r.expirationDate && ISO_DATE.test(r.expirationDate.slice(0, 10))) {
      setExpiry(r.expirationDate.slice(0, 10));
    }
    if (r.usageInstruction) setUsage(r.usageInstruction);
    setScannedConfidence(r.confidence);
  }, []);

  // Step 1 → Step 2. Validates the fields captured on the first screen.
  const goNext = useCallback(() => {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter an item name.');
    if (expiry && !ISO_DATE.test(expiry)) return Alert.alert('Invalid date', 'Use format YYYY-MM-DD.');
    setStep(2);
  }, [name, expiry]);

  // Build the create/update payload (without `source` — the caller adds it for new items).
  // Returns null and alerts if validation fails.
  const buildDto = useCallback((): CreatePantryItemDto | null => {
    const trimmed = name.trim();
    const qty = Number(quantity);
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter an item name.');
      return null;
    }
    if (!Number.isFinite(qty) || qty < 0) {
      Alert.alert('Invalid quantity', 'Enter a valid number.');
      return null;
    }
    if (expiry && !ISO_DATE.test(expiry)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD.');
      return null;
    }
    return {
      name: trimmed,
      quantity: qty,
      unit: unit.trim() || 'pcs',
      category,
      expiryDate: expiry || undefined,
      usageInstruction: usage.trim() || undefined,
    };
  }, [name, quantity, unit, category, expiry, usage]);

  return {
    mode,
    step,
    editingId,
    name,
    quantity,
    unit,
    category,
    expiry,
    usage,
    scannedConfidence,
    setName,
    setQuantity,
    setUnit,
    setCategory,
    setExpiry,
    setUsage,
    setStep,
    openAdd,
    openEdit,
    close,
    applyScan,
    goNext,
    buildDto,
  };
}

export type PantryForm = ReturnType<typeof usePantryForm>;
