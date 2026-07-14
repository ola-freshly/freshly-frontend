import { test, expect } from '@playwright/test';

test('generates a recipe from pantry items', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
    window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
  });

  await page.route('http://localhost:3000/recipes/generate', async (route) => {
    expect(route.request().method()).toBe('POST');

    expect(route.request().postDataJSON()).toEqual({
      pantryItems: ['chicken', 'rice', 'tomato'],
      preferences: 'Vietnamese food',
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Vietnamese Chicken Rice',
        description: 'A simple meal made with pantry ingredients.',
        ingredients: ['chicken', 'rice', 'tomato'],
        instructions: 'Cook the rice, chicken, and tomato together.',
        estimatedTime: 30,
        servings: 2,
        missingIngredients: ['fish sauce'],
      }),
    });
  });

  await page.goto('/generate-recipe');

  await page.getByPlaceholder('Pantry items, separated by commas').fill('chicken, rice, tomato');

  await page.getByPlaceholder('Preferences, cuisine, or allergies').fill('Vietnamese food');

  await page.getByText('Generate Recipe', { exact: true }).click();

  await expect(page.getByText('Recipe generated')).toBeVisible();
  await expect(
    page.getByText('Your AI recipe is ready. You can review and edit it below.'),
  ).toBeVisible();

  await page.getByText('OK', { exact: true }).click();

  await expect(page.locator('input').nth(1)).toHaveValue('Vietnamese Chicken Rice');

  await expect(page.locator('textarea').nth(2)).toHaveValue('chicken, rice, tomato');

  await expect(page.locator('textarea').nth(3)).toHaveValue(
    'Cook the rice, chicken, and tomato together.',
  );

  await expect(page.getByText('Missing ingredients')).toBeVisible();
  await expect(page.getByText('fish sauce')).toBeVisible();
});
