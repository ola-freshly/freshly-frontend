import { test, expect } from '@playwright/test';
import { TEST_USER, login, authHeader } from './helpers';

const UNIQUE = Date.now();
const NEW_USER = {
  name: 'Auth E2E',
  email: `auth+${UNIQUE}@example.com`,
  password: 'Test1234!',
};

test.describe('POST /auth/register', () => {
  test('should register a new user', async ({ request }) => {
    const res = await request.post('/auth/register', {
      data: NEW_USER,
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('should reject duplicate email', async ({ request }) => {
    const res = await request.post('/auth/register', {
      data: NEW_USER,
    });

    expect(res.status()).toBe(409);
  });

  test('should reject invalid email', async ({ request }) => {
    const res = await request.post('/auth/register', {
      data: { name: 'Bad', email: 'not-an-email', password: 'Test1234!' },
    });

    expect(res.status()).toBe(400);
  });

  test('should reject short password', async ({ request }) => {
    const res = await request.post('/auth/register', {
      data: { name: 'Bad', email: `short+${UNIQUE}@example.com`, password: '123' },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('POST /auth/login', () => {
  test('should reject login for unverified user', async ({ request }) => {
    const res = await request.post('/auth/login', {
      data: { email: NEW_USER.email, password: NEW_USER.password },
    });

    expect(res.status()).toBe(403);
  });

  test('should reject wrong password', async ({ request }) => {
    const res = await request.post('/auth/login', {
      data: { email: TEST_USER.email, password: 'wrongpassword' },
    });

    expect(res.status()).toBe(401);
  });

  test('should reject non-existent email', async ({ request }) => {
    const res = await request.post('/auth/login', {
      data: { email: 'nonexistent@example.com', password: 'Test1234!' },
    });

    expect(res.status()).toBe(401);
  });

  test('should return tokens and user on success', async ({ request }) => {
    const res = await request.post('/auth/login', {
      data: TEST_USER,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('name');
  });
});

test.describe('POST /auth/refresh', () => {
  test('should return new access token', async ({ request }) => {
    const tokens = await login(request);

    const res = await request.post('/auth/refresh', {
      data: { refreshToken: tokens.refreshToken },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
  });

  test('should reject invalid refresh token', async ({ request }) => {
    const res = await request.post('/auth/refresh', {
      headers: { Authorization: 'Bearer invalidtoken123' },
    });

    expect(res.status()).toBe(401);
  });
});

test.describe('GET /auth/me', () => {
  test('should return decoded JWT payload', async ({ request }) => {
    const tokens = await login(request);

    const res = await request.get('/auth/me', {
      headers: authHeader(tokens.accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
  });

  test('should reject unauthenticated request', async ({ request }) => {
    const res = await request.get('/auth/me');
    expect(res.status()).toBe(401);
  });
});
