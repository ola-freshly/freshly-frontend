import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PantryItem } from '@/api/types';
import { ACCENT, ACCENT_DIM, BORDER, MUTED, TEXT } from './pantry-theme';
import { fmtQty } from './pantry-utils';

const NONE_KEY = '__none__';

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PantryMergeModal({
  visible,
  items,
  submitting,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  items: PantryItem[];
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: { primaryId: string; expiryDate?: string | null }) => void;
}) {
  const units = useMemo(
    () => Array.from(new Set(items.map((i) => i.unit.trim().toLowerCase()))),
    [items],
  );
  const unitConflict = units.length > 1;

  const expiryOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; value: string | null }>();
    items.forEach((i) => {
      const v = i.expiryDate ? String(i.expiryDate).slice(0, 10) : null;
      const key = v ?? NONE_KEY;
      if (!map.has(key)) {
        map.set(key, { key, label: v ? formatDate(v) : 'No expiry', value: v });
      }
    });
    return Array.from(map.values());
  }, [items]);
  const expiryConflict = expiryOptions.length > 1;

  const total = items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const primary = items[0];

  // Fresh per selection: the parent remounts this modal via a key on the
  // selected ids, so no reset effect is needed.
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  const canConfirm = !unitConflict && (!expiryConflict || chosenKey !== null) && !submitting;

  const confirm = () => {
    if (!canConfirm || !primary) return;
    const expiryDate = expiryConflict
      ? (expiryOptions.find((o) => o.key === chosenKey)?.value ?? null)
      : undefined;
    onConfirm({ primaryId: primary.id, expiryDate });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Merge {items.length} items</Text>

          {unitConflict ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#B91C1C" />
              <Text style={styles.errorText}>
                These items use different units ({units.join(', ')}) and can&apos;t be merged.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.summary}>
                Combined into <Text style={styles.strong}>{primary?.name}</Text> —{' '}
                <Text style={styles.strong}>
                  {fmtQty(total)} {primary?.unit}
                </Text>
              </Text>

              {expiryConflict && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Keep which expiry date?</Text>
                  {expiryOptions.map((o) => {
                    const active = chosenKey === o.key;
                    return (
                      <Pressable
                        key={o.key}
                        style={styles.option}
                        onPress={() => setChosenKey(o.key)}
                      >
                        <Ionicons
                          name={active ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={active ? ACCENT : '#C4C4C4'}
                        />
                        <Text style={styles.optionText}>{o.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            {!unitConflict && (
              <Pressable
                style={[styles.btn, styles.btnPrimary, !canConfirm && styles.btnDisabled]}
                onPress={confirm}
                disabled={!canConfirm}
              >
                <Text style={styles.btnPrimaryText}>Merge</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 22,
  },
  title: { fontSize: 19, fontWeight: '700', color: TEXT },
  summary: { marginTop: 12, fontSize: 15, color: MUTED, lineHeight: 22 },
  strong: { color: TEXT, fontWeight: '700' },

  errorBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: { flex: 1, color: '#991B1B', fontSize: 14, lineHeight: 20 },

  section: { marginTop: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: TEXT, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  optionText: { fontSize: 15, color: TEXT },

  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: ACCENT_DIM },
  btnGhostText: { color: ACCENT, fontWeight: '700', fontSize: 15 },
  btnPrimary: { backgroundColor: ACCENT },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});
