import apiClient from './client';
import { tokenStorage } from './tokenStorage';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await tokenStorage.clearTokens();
  },
};
