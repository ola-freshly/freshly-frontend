import { test, expect } from '@playwright/test';
import { getAuthToken, authHeader } from './helpers';

let accessToken = '';
let createdRecipeId = '';

const RECIPE = {
  title: 'E2E Test Pasta',
  description: 'A test pasta recipe',
  cuisine: 'Italian',
  servings: 2,
  cookTime: 30,
  instructions: 'Boil water. Cook pasta. Add sauce. Serve.',
  ingredients: [
    { ingredientName: 'Spaghetti', quantity: 200, unit: 'g' },
    { ingredientName: 'Tomato sauce', quantity: 100, unit: 'ml' },
  ],
};

test.beforeAll(async ({ request }) => {
  accessToken = await getAuthToken(request);
});

test.describe('Recipes CRUD', () => {
  test('POST /recipes — create recipe', async ({ request }) => {
    const res = await request.post('/recipes', {
      headers: authHeader(accessToken),
      data: RECIPE,
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.title).toBe(RECIPE.title);
    expect(body.cuisine).toBe(RECIPE.cuisine);
    expect(body).toHaveProperty('id');
    createdRecipeId = body.id;
  });

  test('GET /recipes — list all recipes', async ({ request }) => {
    const res = await request.get('/recipes', {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /recipes/:id — get single recipe', async ({ request }) => {
    const res = await request.get(`/recipes/${createdRecipeId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdRecipeId);
    expect(body.title).toBe(RECIPE.title);
  });

  test('PUT /recipes/:id — update recipe', async ({ request }) => {
    const res = await request.put(`/recipes/${createdRecipeId}`, {
      headers: authHeader(accessToken),
      data: { title: 'Updated Pasta', servings: 4 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated Pasta');
    expect(body.servings).toBe(4);
  });

  test('DELETE /recipes/:id — delete recipe', async ({ request }) => {
    const res = await request.delete(`/recipes/${createdRecipeId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  test('GET /recipes/:id — returns 404 after deletion', async ({ request }) => {
    const res = await request.get(`/recipes/${createdRecipeId}`, {
      headers: authHeader(accessToken),
    });

    expect(res.status()).toBe(404);
  });

  test('POST /recipes — rejects missing title', async ({ request }) => {
    const res = await request.post('/recipes', {
      headers: authHeader(accessToken),
      data: { instructions: 'No title provided' },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('POST /recipes/generate', () => {
  test(
    'should AI-generate a recipe',
    async ({ request }) => {
      const res = await request.post('/recipes/generate', {
        headers: authHeader(accessToken),
        data: { servings: 2, cuisine: 'Italian', mealType: 'dinner' },
      });

      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('instructions');
    },
    { timeout: 30_000 },
  );
});
