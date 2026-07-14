import { test, expect } from '@playwright/test';
import { getAuthToken, authHeader } from './helpers';

let accessToken = '';

test.beforeAll(async ({ request }) => {
  accessToken = await getAuthToken(request);
});

test.describe('GET /users/me', () => {
  test('should return user profile', async ({ request }) => {
    const res = await request.get('/users/me', {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('name');
  });

  test('should reject unauthenticated request', async ({ request }) => {
    const res = await request.get('/users/me');
    expect(res.status()).toBe(401);
  });
});

test.describe('PATCH /users/me', () => {
  test('should update user name', async ({ request }) => {
    const res = await request.patch('/users/me', {
      headers: authHeader(accessToken),
      data: { name: 'Updated Name' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated Name');
  });

  test('should update phone number', async ({ request }) => {
    const res = await request.patch('/users/me', {
      headers: authHeader(accessToken),
      data: { phone: '+1234567890' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.phone).toBe('+1234567890');
  });

  test('should update weight', async ({ request }) => {
    const res = await request.patch('/users/me', {
      headers: authHeader(accessToken),
      data: { weight: 75 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Number(body.weight)).toBe(75);
  });

  test('should update height', async ({ request }) => {
    const res = await request.patch('/users/me', {
      headers: authHeader(accessToken),
      data: { height: 180 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Number(body.height)).toBe(180);
  });

  test('should update preferredPlan', async ({ request }) => {
    const res = await request.patch('/users/me', {
      headers: authHeader(accessToken),
      data: { preferredPlan: 'gain' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.preferredPlan).toBe('gain');
  });

  test('should reject invalid preferredPlan value', async ({ request }) => {
    const res = await request.patch('/users/me', {
      headers: authHeader(accessToken),
      data: { preferredPlan: 'invalid' },
    });

    expect(res.status()).toBe(400);
  });

  test('should reject unauthenticated request', async ({ request }) => {
    const res = await request.patch('/users/me', {
      data: { name: 'Hacker' },
    });
    expect(res.status()).toBe(401);
  });
});
