import client from './client';
import type { ApiResponse } from './types';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  dietary_preferences: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
}

export const usersApi = {
  /**
   * GET /users/me — fetch current user profile
   */
  getMe: async (): Promise<UserProfile> => {
    const res = await client.get<ApiResponse<UserProfile>>('/users/me');
    return res.data.data;
  },

  /**
   * PATCH /users/me — update profile fields
   */
  updateMe: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await client.patch<ApiResponse<UserProfile>>('/users/me', payload);
    return res.data.data;
  },
};
