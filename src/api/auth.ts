import client from './client';
import { tokenStorage } from './tokenStorage';
import type { UserProfile } from './users';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<UserProfile> => {
    const res = await client.post<LoginResponse>('/auth/login', payload);
    const { accessToken, refreshToken } = res.data;
    await Promise.all([
      tokenStorage.setAccessToken(accessToken),
      tokenStorage.setRefreshToken(refreshToken),
    ]);
    return res.data.user as UserProfile;
  },

  logout: async (): Promise<void> => {
    await tokenStorage.clearTokens();
  },
};
