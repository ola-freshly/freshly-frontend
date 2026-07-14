import { test, expect } from '@playwright/test';
import { getAuthToken, authHeader } from './helpers';

let accessToken = '';
let createdItemId = '';

const ITEM = {
  name: 'Test Eggs',
  quantity: 12,
  unit: 'pcs',
};

test.beforeAll(async ({ request }) => {
  accessToken = await getAuthToken(request);
});

test.describe('Shopping List CRUD', () => {
  test('POST /shopping-list — add item', async ({ request }) => {
    const res = await request.post('/shopping-list', {
      headers: authHeader(accessToken),
      data: ITEM,
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe(ITEM.name);
    expect(body.quantity).toBe(ITEM.quantity);
    expect(body.unit).toBe(ITEM.unit);
    expect(body.purchased).toBe(false);
    expect(body).toHaveProperty('id');
    createdItemId = body.id;
  });

  test('GET /shopping-list — list all items', async ({ request }) => {
    const res = await request.get('/shopping-list', {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('PATCH /shopping-list/:id — toggle purchased', async ({ request }) => {
    const res = await request.patch(`/shopping-list/${createdItemId}`, {
      headers: authHeader(accessToken),
      data: { purchased: true },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.purchased).toBe(true);
  });

  test('PATCH /shopping-list/:id — update quantity', async ({ request }) => {
    const res = await request.patch(`/shopping-list/${createdItemId}`, {
      headers: authHeader(accessToken),
      data: { quantity: 6 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.quantity).toBe(6);
  });

  test('DELETE /shopping-list/:id — delete item', async ({ request }) => {
    const res = await request.delete(`/shopping-list/${createdItemId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdItemId);
  });

  test('DELETE /shopping-list/:id — returns 404 after deletion', async ({ request }) => {
    const res = await request.delete(`/shopping-list/${createdItemId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(404);
  });
});

test.describe('Shopping List auth', () => {
  test('GET /shopping-list — rejects unauthenticated request', async ({ request }) => {
    const res = await request.get('/shopping-list');
    expect(res.status()).toBe(401);
  });
});
