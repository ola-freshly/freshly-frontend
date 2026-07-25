import client from './client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  preferredPlan?: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
  height?: number;
  weight?: number;
}

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const res = await client.get<UserProfile>('/users/me');
    return res.data;
  },

  updateMe: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await client.patch<UserProfile>('/users/me', payload);
    return res.data;
  },
};
