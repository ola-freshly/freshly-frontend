import axios from 'axios';
import { ENV } from '@/config/env';
import { tokenStorage } from './tokenStorage';

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data } = await axios.post<{ accessToken: string }>(`${ENV.API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  await tokenStorage.setAccessToken(data.accessToken);
  return data.accessToken;
}
