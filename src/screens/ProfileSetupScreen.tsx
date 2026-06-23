import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { usersApi } from '@/api/users';

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  // ─── Validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: { fullName?: string; phone?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Save profile ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await usersApi.updateMe({
        full_name: fullName.trim(),
        ...(phone.trim() && { phone: phone.trim() }),
      });
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Skip ─────────────────────────────────────────────────────
  const handleSkip = () => {
    router.replace('/');
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {fullName.trim() ? fullName.trim()[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Help us personalise your Freshly experience</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full name *</Text>
            <TextInput
              style={[styles.input, errors.fullName ? styles.inputError : null]}
              placeholder="e.g. Nguyen Van A"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!loading}
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={[styles.input, errors.phone ? styles.inputError : null]}
              placeholder="e.g. +84 901 234 567"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
              }}
              keyboardType="phone-pad"
              returnKeyType="done"
              editable={!loading}
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          {/* Address placeholder */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Address</Text>
            <TouchableOpacity style={styles.placeholderButton} disabled>
              <Text style={styles.placeholderText}>Coming soon</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar placeholder */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Profile photo</Text>
            <TouchableOpacity style={styles.placeholderButton} disabled>
              <Text style={styles.placeholderText}>Coming soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, loading ? styles.saveButtonDisabled : null]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Skip button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loading}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 36 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: '#22C55E' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  // Form
  form: { gap: 20, marginBottom: 32 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 2 },
  placeholderButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderText: { fontSize: 15, color: '#9CA3AF' },

  // Actions
  actions: { gap: 12 },
  saveButton: {
    height: 52,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#86EFAC' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: { fontSize: 15, color: '#6B7280' },
});
