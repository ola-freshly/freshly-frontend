import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>U</Text>
      </View>
      <Text style={styles.name}>User</Text>

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
  name: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 32 },
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
