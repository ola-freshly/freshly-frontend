import { Platform, Alert } from 'react-native';
import { toast } from 'react-toastify';

export const showToastError = (message: string) => {
  if (Platform.OS === 'web') {
    toast.error(message);
  } else {
    Alert.alert('Error', message);
  }
};

export const showToastSuccess = (message: string) => {
  if (Platform.OS === 'web') {
    toast.success(message);
  } else {
    Alert.alert('Success', message);
  }
};
