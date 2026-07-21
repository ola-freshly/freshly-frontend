import { test, expect } from '@playwright/test';

test.describe('Recipe management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
      window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
    });

    await page.route('http://localhost:3000/recipes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'recipe-1',
              title: 'Chicken Fried Rice',
              cookTime: 25,
              servings: 2,
            },
          ]),
        });
        return;
      }

      await route.continue();
    });
  });

  test('shows the action buttons and recipe list', async ({ page }) => {
    await page.goto('/recipes');

    await expect(page.getByText('Create Recipe')).toBeVisible();
    await expect(page.getByText('AI Generator')).toBeVisible();

    await expect(page.getByText('Chicken Fried Rice')).toBeVisible();
    await expect(page.getByText('25 min • 2 servings')).toBeVisible();
  });
});
