import { test, expect } from '@playwright/test';

test('generates a recipe preview from the pantry and shows save / regenerate', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
    window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
  });

  // The screen loads the user's pantry on mount for the read-only preview.
  await page.route('http://localhost:3000/pantry-items', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'p1', name: 'chicken', quantity: 1, unit: 'kg', source: 'manual' },
        { id: 'p2', name: 'rice', quantity: 500, unit: 'g', source: 'manual' },
      ]),
    });
  });

  // Pantry is read server-side, so the client only sends the refinement inputs.
  await page.route('http://localhost:3000/recipes/generate', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      mealType: 'dinner',
      cuisine: 'Asian',
      servings: 2,
      notes: 'high protein',
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Chicken Fried Rice',
        description: 'A quick pantry dinner.',
        cuisine: 'Asian',
        servings: 2,
        estimatedMinutes: 30,
        ingredients: [
          { name: 'chicken', quantity: 300, unit: 'g' },
          { name: 'rice', quantity: 400, unit: 'g' },
        ],
        instructions: ['Cook the rice.', 'Fry the chicken.'],
        nutrition: { calories: 620, protein: 45, carbs: 60, fat: 18 },
        missingIngredients: [{ name: 'fish sauce', quantity: 15, unit: 'ml' }],
      }),
    });
  });

  await page.goto('/generate-recipe');

  // Pantry preview loaded.
  await expect(page.getByText('Cooking from your pantry')).toBeVisible();

  // Fill the refinement inputs (servings defaults to 2).
  await page.getByText('Dinner', { exact: true }).click();
  await page.getByPlaceholder('e.g. Italian, Thai (optional)').fill('Asian');
  await page
    .getByPlaceholder('e.g. high protein, no dairy, make it spicy (optional)')
    .fill('high protein');

  await page.getByText('Generate Recipe', { exact: true }).click();

  // Inline preview.
  await expect(page.getByText('Chicken Fried Rice')).toBeVisible();
  await expect(page.getByText('30 min')).toBeVisible();
  await expect(page.getByText('620 kcal')).toBeVisible();
  await expect(page.getByText("You'll need to buy")).toBeVisible();
  await expect(page.getByText('fish sauce')).toBeVisible();
  await expect(page.getByText('Save recipe')).toBeVisible();

  // Regeneration now requires the user to clarify what to change.
  await page.getByText('Generate another').click();
  await expect(page.getByText('What should we change?')).toBeVisible();
});
