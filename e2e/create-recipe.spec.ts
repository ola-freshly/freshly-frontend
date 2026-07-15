import { test, expect } from '@playwright/test';

test('creates a recipe successfully', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
    window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
  });

  await page.route('http://localhost:3000/recipes', async (route) => {
    expect(route.request().method()).toBe('POST');

    expect(route.request().postDataJSON()).toEqual({
      title: 'Chicken Pasta',
      description: 'Easy dinner recipe',
      ingredients: ['chicken', 'pasta', 'tomato sauce'],
      instructions: 'Cook the pasta and mix all ingredients.',
      servings: 2,
      estimatedTime: 30,
    });

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'recipe-2',
        title: 'Chicken Pasta',
        description: 'Easy dinner recipe',
        ingredients: ['chicken', 'pasta', 'tomato sauce'],
        instructions: 'Cook the pasta and mix all ingredients.',
        servings: 2,
        estimatedTime: 30,
      }),
    });
  });

  await page.goto('/create-recipe');

  await page.getByPlaceholder('Recipe title').fill('Chicken Pasta');
  await page.getByPlaceholder('Description').fill('Easy dinner recipe');
  await page
    .getByPlaceholder('Ingredients, separated by commas')
    .fill('chicken, pasta, tomato sauce');
  await page
    .getByPlaceholder('Cooking instructions')
    .fill('Cook the pasta and mix all ingredients.');

  await page.getByText('Save Recipe').click();

  await expect(page.getByText('Recipe created')).toBeVisible();
  await expect(page.getByText('Your recipe has been saved.')).toBeVisible();
  await expect(page.getByText('OK', { exact: true })).toBeVisible();
});
