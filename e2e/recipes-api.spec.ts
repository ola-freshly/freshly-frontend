import { createHmac } from 'node:crypto';
import { test, expect } from '@playwright/test';

const API_URL = process.env.FRESHLY_API_URL ?? 'http://localhost:3001';

function createAccessToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  const header = encode({
    alg: 'HS256',
    typ: 'JWT',
  });

  const payload = encode({
    sub: 'e2e-user',
    email: 'e2e@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  });

  const signature = createHmac('sha256', 'e2e-test-secret')
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

test.describe('Recipes API', () => {
  test('rejects requests without an access token', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({
      message: 'Unauthorized',
      statusCode: 401,
    });
  });

  test('returns recipes with a valid access token', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes`, {
      headers: {
        Authorization: `Bearer ${createAccessToken()}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });
});
