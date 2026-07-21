import { test, expect } from '@playwright/test';

test('creates a recipe successfully', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
    window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
  });

  await page.route('http://localhost:3000/recipes', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    expect(route.request().postDataJSON()).toEqual({
      title: 'Chicken Pasta',
      description: 'Easy dinner recipe',
      instructions: '1. Cook the pasta and mix all ingredients.',
      ingredients: [{ ingredientName: 'chicken', quantity: 200, unit: 'g' }],
    });

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'recipe-2',
        title: 'Chicken Pasta',
        description: 'Easy dinner recipe',
        instructions: '1. Cook the pasta and mix all ingredients.',
        ingredients: [{ ingredientName: 'chicken', quantity: 200, unit: 'g' }],
      }),
    });
  });

  await page.goto('/create-recipe');

  await page.getByPlaceholder('Name your recipe').fill('Chicken Pasta');
  await page.getByPlaceholder('Introduce your recipe').fill('Easy dinner recipe');

  // One ingredient row and one step row exist by default.
  await page.getByPlaceholder('Ingredient', { exact: true }).fill('chicken');
  await page.getByPlaceholder('Qty', { exact: true }).fill('200');
  await page.getByPlaceholder('Unit', { exact: true }).fill('g');
  await page
    .getByPlaceholder('Step 1', { exact: true })
    .fill('Cook the pasta and mix all ingredients.');

  // Save lives in the navigation header.
  await page.getByText('Save', { exact: true }).click();

  await expect(page.getByText('Recipe created')).toBeVisible();
  await expect(page.getByText('Your recipe has been saved.')).toBeVisible();
  await expect(page.getByText('OK', { exact: true })).toBeVisible();
});
