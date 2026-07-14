import { test, expect } from '@playwright/test';
import { getAuthToken, authHeader } from './helpers';

let accessToken = '';
let createdPlanId = '';

const PLAN = {
  name: 'E2E Test Week',
  startDate: '2026-07-14T00:00:00.000Z',
  endDate: '2026-07-20T00:00:00.000Z',
};

test.beforeAll(async ({ request }) => {
  accessToken = await getAuthToken(request);
});

test.describe('Meal Plans CRUD', () => {
  test('POST /meal-plans — create plan', async ({ request }) => {
    const res = await request.post('/meal-plans', {
      headers: authHeader(accessToken),
      data: PLAN,
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe(PLAN.name);
    expect(body).toHaveProperty('id');
    createdPlanId = body.id;
  });

  test('GET /meal-plans — list all plans', async ({ request }) => {
    const res = await request.get('/meal-plans', {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /meal-plans/:id — get single plan', async ({ request }) => {
    const res = await request.get(`/meal-plans/${createdPlanId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdPlanId);
    expect(body.name).toBe(PLAN.name);
  });

  test('PUT /meal-plans/:id — update plan', async ({ request }) => {
    const res = await request.put(`/meal-plans/${createdPlanId}`, {
      headers: authHeader(accessToken),
      data: { name: 'Updated Week Plan' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated Week Plan');
  });

  test('DELETE /meal-plans/:id — delete plan', async ({ request }) => {
    const res = await request.delete(`/meal-plans/${createdPlanId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdPlanId);
  });

  test('GET /meal-plans/:id — returns 404 after deletion', async ({ request }) => {
    const res = await request.get(`/meal-plans/${createdPlanId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(404);
  });

  test('POST /meal-plans — rejects missing name', async ({ request }) => {
    const res = await request.post('/meal-plans', {
      headers: authHeader(accessToken),
      data: { startDate: PLAN.startDate, endDate: PLAN.endDate },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('POST /meal-plans/:id/generate', () => {
  let planId = '';

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/meal-plans', {
      headers: authHeader(accessToken),
      data: {
        name: 'AI Generate Test',
        startDate: '2026-07-21T00:00:00.000Z',
        endDate: '2026-07-27T00:00:00.000Z',
      },
    });
    const body = await res.json();
    planId = body.id;
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`/meal-plans/${planId}`, {
      headers: authHeader(accessToken),
    });
  });

  test('should AI-generate meals for a day', async ({ request }) => {
    test.setTimeout(30_000);
    const res = await request.post(`/meal-plans/${planId}/generate`, {
      headers: authHeader(accessToken),
      data: {
        mealDate: '2026-07-22T00:00:00.000Z',
        mealTypes: ['lunch'],
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('shoppingList');
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(1);
  });
});
