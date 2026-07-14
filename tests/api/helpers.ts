import { expect, type APIRequestContext } from '@playwright/test';

export const TEST_USER = {
  email: 'e2etest@freshly.com',
  password: 'Test1234!',
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function login(
  request: APIRequestContext,
): Promise<AuthTokens> {
  const res = await request.post('/auth/login', {
    data: TEST_USER,
  });

  expect(res.status()).toBe(200);
  return res.json();
}

export async function getAuthToken(
  request: APIRequestContext,
): Promise<string> {
  const tokens = await login(request);
  return tokens.accessToken;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
