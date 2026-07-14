import { test, expect } from '@playwright/test';
import { getAuthToken, authHeader } from './helpers';

let accessToken = '';
let createdItemId = '';

const ITEM = {
  name: 'Test Milk',
  quantity: 2,
  unit: 'liters',
  category: 'dairy',
};

test.beforeAll(async ({ request }) => {
  accessToken = await getAuthToken(request);
});

test.describe('Pantry CRUD', () => {
  test('POST /pantry-items — create item', async ({ request }) => {
    const res = await request.post('/pantry-items', {
      headers: authHeader(accessToken),
      data: ITEM,
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe(ITEM.name);
    expect(body.quantity).toBe(ITEM.quantity);
    expect(body.unit).toBe(ITEM.unit);
    expect(body).toHaveProperty('id');
    createdItemId = body.id;
  });

  test('GET /pantry-items — list all items', async ({ request }) => {
    const res = await request.get('/pantry-items', {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /pantry-items/:id — get single item', async ({ request }) => {
    const res = await request.get(`/pantry-items/${createdItemId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdItemId);
    expect(body.name).toBe(ITEM.name);
  });

  test('PUT /pantry-items/:id — update item', async ({ request }) => {
    const res = await request.put(`/pantry-items/${createdItemId}`, {
      headers: authHeader(accessToken),
      data: { name: 'Updated Milk', quantity: 5 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated Milk');
    expect(body.quantity).toBe(5);
  });

  test('DELETE /pantry-items/:id — delete item', async ({ request }) => {
    const res = await request.delete(`/pantry-items/${createdItemId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  test('GET /pantry-items/:id — returns 404 after deletion', async ({ request }) => {
    const res = await request.get(`/pantry-items/${createdItemId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(404);
  });
});

test.describe('POST /pantry-items/scan-barcode', () => {
  test(
    'should scan a valid barcode',
    async ({ request }) => {
      const res = await request.post('/pantry-items/scan-barcode', {
        headers: authHeader(accessToken),
        data: { barcode: '3017620422003' },
      });

      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body).toHaveProperty('name');
      expect(body).toHaveProperty('category');
      expect(body).toHaveProperty('confidence');
    },
    { timeout: 15_000 },
  );

  test('should reject unknown barcode', async ({ request }) => {
    const res = await request.post('/pantry-items/scan-barcode', {
      headers: authHeader(accessToken),
      data: { barcode: '0000000000000' },
    });

    expect(res.status()).toBe(404);
  });

  test('should reject empty barcode', async ({ request }) => {
    const res = await request.post('/pantry-items/scan-barcode', {
      headers: authHeader(accessToken),
      data: { barcode: '' },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('Pantry auth', () => {
  test('GET /pantry-items — rejects unauthenticated request', async ({ request }) => {
    const res = await request.get('/pantry-items');
    expect(res.status()).toBe(401);
  });

  test('GET /pantry-items — rejects invalid token', async ({ request }) => {
    const res = await request.get('/pantry-items', {
      headers: { Authorization: 'Bearer invalidtoken123' },
    });
    expect(res.status()).toBe(401);
  });
});
