import { test, expect } from '@playwright/test';
import { getAuthToken, authHeader } from './helpers';

let accessToken = '';
let planId = '';
let recipeId = '';
let itemId = '';

test.beforeAll(async ({ request }) => {
  accessToken = await getAuthToken(request);

  const planRes = await request.post('/meal-plans', {
    headers: authHeader(accessToken),
    data: {
      name: 'Meal Plan Items Test',
      startDate: '2026-07-28T00:00:00.000Z',
      endDate: '2026-08-03T00:00:00.000Z',
    },
  });
  const planBody = await planRes.json();
  planId = planBody.id;

  const recipeRes = await request.post('/recipes', {
    headers: authHeader(accessToken),
    data: {
      title: 'Meal Plan Items Recipe',
      instructions: 'Cook it.',
    },
  });
  const recipeBody = await recipeRes.json();
  recipeId = recipeBody.id;
});

test.afterAll(async ({ request }) => {
  if (itemId) {
    await request.delete(`/meal-plan-items/${itemId}`, {
      headers: authHeader(accessToken),
    });
  }
  await request.delete(`/recipes/${recipeId}`, {
    headers: authHeader(accessToken),
  });
  await request.delete(`/meal-plans/${planId}`, {
    headers: authHeader(accessToken),
  });
});

test.describe('Meal Plan Items', () => {
  test('POST /meal-plan-items — add item to plan', async ({ request }) => {
    const res = await request.post('/meal-plan-items', {
      headers: authHeader(accessToken),
      data: {
        mealPlanId: planId,
        recipeId: recipeId,
        mealDate: '2026-07-29T00:00:00.000Z',
        mealType: 'lunch',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.mealType).toBe('lunch');
    itemId = body.id;
  });

  test('GET /meal-plan-items — list items for plan', async ({ request }) => {
    const res = await request.get(`/meal-plan-items?mealPlanId=${planId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('DELETE /meal-plan-items/:id — remove item', async ({ request }) => {
    const res = await request.delete(`/meal-plan-items/${itemId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(itemId);
    itemId = '';
  });

  test('GET /meal-plan-items — empty list after deletion', async ({ request }) => {
    const res = await request.get(`/meal-plan-items?mealPlanId=${planId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(0);
  });

  test('GET /meal-plan-items — rejects missing mealPlanId', async ({ request }) => {
    const res = await request.get('/meal-plan-items', {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(400);
  });
});
