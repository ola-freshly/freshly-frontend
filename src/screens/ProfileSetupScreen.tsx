import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { usersApi } from '@/api/users';

const GREEN = '#16A34A';
const GREEN_LIGHT = '#F0FDF4';
const GREEN_DIM = '#DCFCE7';

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const fieldStyle = (key: string, hasError?: boolean) => ({
    borderColor: hasError ? '#EF4444' : focused === key ? GREEN : '#E5E7EB',
    backgroundColor: focused === key ? '#ffffff' : '#F9FAFB',
  });

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    else if (fullName.trim().length < 2) next.fullName = 'Name must be at least 2 characters';
    if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) next.phone = 'Enter a valid phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await usersApi.updateMe({
        name: fullName.trim(),
        ...(phone.trim() && { phone: phone.trim() }),
      });
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Set Up Profile',
          headerBackButtonDisplayMode: 'minimal',
          headerRight: () => (
            <Pressable
              onPress={() => router.replace('/')}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.45 : 1 })}
            >
              <Text style={{ fontSize: 16, color: '#6B7280' }}>Skip</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 52, gap: 28 }}
      >
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'Photo upload will be available soon.')}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: GREEN_LIGHT,
                borderWidth: 2,
                borderColor: GREEN_DIM,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {fullName.trim() ? (
                <Text style={{ fontSize: 38, fontWeight: '600', color: GREEN }}>
                  {fullName.trim()[0].toUpperCase()}
                </Text>
              ) : (
                <Image
                  source="sf:person.fill"
                  style={{ width: 42, height: 42 }}
                  tintColor={GREEN}
                  contentFit="contain"
                />
              )}
            </View>

            {/* Camera badge */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: GREEN,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2.5,
                borderColor: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
              }}
            >
              <Image
                source="sf:camera.fill"
                style={{ width: 14, height: 14 }}
                tintColor="#ffffff"
                contentFit="contain"
              />
            </View>
          </Pressable>

          <Text style={{ fontSize: 13, fontWeight: '500', color: GREEN }}>Add photo</Text>
        </View>

        <View style={{ gap: 20 }}>
          <View style={{ gap: 7 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
              Full name <Text style={{ color: GREEN }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 52,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1.5,
                paddingHorizontal: 14,
                gap: 10,
                ...fieldStyle('name', !!errors.fullName),
              }}
            >
              <Image
                source="sf:person"
                style={{ width: 17, height: 17 }}
                tintColor="#9CA3AF"
                contentFit="contain"
              />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#111827' }}
                placeholder="e.g. Phuc Tran"
                placeholderTextColor="#C4C9D4"
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
                }}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            {errors.fullName ? (
              <Text style={{ fontSize: 12, color: '#EF4444', paddingLeft: 4 }}>
                {errors.fullName}
              </Text>
            ) : null}
          </View>

          <View style={{ gap: 7 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
              Phone number <Text style={{ color: GREEN }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 52,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1.5,
                overflow: 'hidden',
                ...fieldStyle('phone', !!errors.phone),
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  height: '100%',
                  borderRightWidth: 1.5,
                  borderRightColor: '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 18 }}>🇻🇳</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>+84</Text>
              </View>
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#111827', paddingHorizontal: 14 }}
                placeholder="901 234 567"
                placeholderTextColor="#C4C9D4"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                }}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                keyboardType="phone-pad"
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            {errors.phone ? (
              <Text style={{ fontSize: 12, color: '#EF4444', paddingLeft: 4 }}>{errors.phone}</Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={{ gap: 7 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
              Email address <Text style={{ color: GREEN }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 52,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1.5,
                paddingHorizontal: 14,
                gap: 10,
                ...fieldStyle('email'),
              }}
            >
              <Image
                source="sf:envelope"
                style={{ width: 17, height: 17 }}
                tintColor="#9CA3AF"
                contentFit="contain"
              />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#111827' }}
                placeholder="you@example.com"
                placeholderTextColor="#C4C9D4"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* ── Continue button ─────────────────────────────────── */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: loading ? '#86EFAC' : GREEN,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            boxShadow: loading ? undefined : '0 4px 16px rgba(22,163,74,0.30)',
          })}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
                Save & Continue
              </Text>
              <Image
                source="sf:arrow.right"
                style={{ width: 16, height: 16 }}
                tintColor="#ffffff"
                contentFit="contain"
              />
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
