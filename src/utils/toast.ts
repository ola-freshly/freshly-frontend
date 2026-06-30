import { Platform } from 'react-native';
import { toast } from 'react-toastify';

export const showToastError = (message: string) => {
  if (Platform.OS === 'web') {
    toast.error(message);
  }
};

export const showToastSuccess = (message: string) => {
  if (Platform.OS === 'web') {
    toast.success(message);
  }
};
