import * as Haptics from 'expo-haptics';

// Haptics are an iOS-only delight; guard so Android/web stay silent no-ops.
const isIOS = process.env.EXPO_OS === 'ios';

export const tapLight = () => {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const tapMedium = () => {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const notifySuccess = () => {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const notifyError = () => {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
