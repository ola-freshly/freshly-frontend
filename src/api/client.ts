import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';
import { tokenStorage } from './tokenStorage';
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
  // For multipart uploads, drop the default application/json so the runtime sets
  // Content-Type with the correct boundary — otherwise the server can't parse
  // the file part (@UploadedFile() comes back undefined).
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

const MAX_RETRIES = 3;

function isRetryable(status: number | undefined, error: AxiosError): boolean {
  if (!status || status >= 500) return true;
  if (!error.response) return true;
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    if (!config || config._retryCount === undefined) config._retryCount = 0;

    if (config._retryCount < MAX_RETRIES && isRetryable(error.response?.status, error)) {
      config._retryCount += 1;
      const delay = Math.min(1000 * 2 ** config._retryCount, 8000);
      await sleep(delay);
      return client(config);
    }

    const status = error.response?.status;

    if (status === 401 && !config.url?.includes('/auth/refresh')) {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post<{ accessToken: string }>(
            `${ENV.API_BASE_URL}/auth/refresh`,
            { refreshToken },
          );
          await tokenStorage.setAccessToken(data.accessToken);

          config.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(config);
        } catch {
          await tokenStorage.clearTokens();
          return Promise.reject<ApiError>({ message: 'Session expired', statusCode: 401 });
        }
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
