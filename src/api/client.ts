import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';
import { tokenStorage } from './tokenStorage';
import { refreshAccessToken } from './refresh';
import type { ApiError } from './types';

const client: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors into a consistent ApiError shape
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    if (status === 401 && !error.config?.url?.includes('/auth/refresh')) {
      try {
        const newToken = await refreshAccessToken();
        const originalRequest = error.config!;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch {
        await tokenStorage.clearTokens();
        return Promise.reject<ApiError>({ message: 'Session expired', statusCode: 401 });
      }
    }

    const normalised: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'Unknown error',
      statusCode: status ?? 0,
      error: error.response?.data?.error,
    };
    return Promise.reject(normalised);
  },
);

export default client;
