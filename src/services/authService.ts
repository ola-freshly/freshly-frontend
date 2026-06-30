import { apiClient } from '@/api';
import type { ApiError } from '@/api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RegisterResponse {
  message: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', {
    name,
    email,
    password,
  });
  return data;
}

export type { ApiError };
