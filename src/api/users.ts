import client from './client';
import type { ApiResponse } from './types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const res = await client.get<ApiResponse<UserProfile>>('/users/me');
    return res.data.data;
  },

  updateMe: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await client.patch<ApiResponse<UserProfile>>('/users/me', payload);
    return res.data.data;
  },
};
