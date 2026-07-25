import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi, UserProfile } from '@/api/users';

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#F59E0B' };
  if (bmi < 25) return { label: 'Normal', color: '#16A34A' };
  if (bmi < 30) return { label: 'Overweight', color: '#F97316' };
  return { label: 'Obese', color: '#EF4444' };
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      usersApi.getMe().then(setProfile);
    }, []),
  );

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  const initial = profile?.name?.[0]?.toUpperCase() ?? 'U';
  const bmi = profile?.bmi;
  const cat = bmi != null ? bmiCategory(bmi) : null;

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{profile?.name ?? 'User'}</Text>

      {bmi != null && cat && (
        <View style={styles.bmiCard}>
          <Text style={styles.bmiTitle}>BMI</Text>
          <Text style={[styles.bmiValue, { color: cat.color }]}>{bmi}</Text>
          <Text style={[styles.bmiLabel, { color: cat.color }]}>{cat.label}</Text>
          <View style={styles.bmiDetails}>
            <View style={styles.bmiDetailItem}>
              <Text style={styles.bmiDetailValue}>{profile?.height ?? '–'}</Text>
              <Text style={styles.bmiDetailLabel}>cm</Text>
            </View>
            <View style={styles.bmiDivider} />
            <View style={styles.bmiDetailItem}>
              <Text style={styles.bmiDetailValue}>{profile?.weight ?? '–'}</Text>
              <Text style={styles.bmiDetailLabel}>kg</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.menu}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/edit-profile')}>
          <Text style={styles.rowText}>Edit Profile</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/notifications')}>
          <Text style={styles.rowText}>Notifications</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 20 },
  bmiCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  bmiTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  bmiValue: { fontSize: 36, fontWeight: '700' },
  bmiLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  bmiDetails: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  bmiDetailItem: { alignItems: 'center' },
  bmiDetailValue: { fontSize: 18, fontWeight: '600', color: '#374151' },
  bmiDetailLabel: { fontSize: 12, color: '#9CA3AF' },
  bmiDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  menu: { borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowText: { fontSize: 16, color: '#333' },
  arrow: { fontSize: 20, color: '#999' },
  logout: { marginTop: 32, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
