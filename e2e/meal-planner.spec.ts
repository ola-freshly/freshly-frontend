import { test, expect } from '@playwright/test';

test('shows planned meals and opens meal suggestion', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
    window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
  });

  await page.goto('/meal-planner');

  await expect(page.getByText(/1,?580 kcal this week/)).toBeVisible();

  await expect(page.getByText('Greek Yogurt & Berry Bowl')).toBeVisible();
  await expect(page.getByText('Grilled Chicken Salad')).toBeVisible();
  await expect(page.getByText('Shrimp Tom Yum Soup')).toBeVisible();
  await expect(page.getByText('Avocado Toast')).toBeVisible();

  await page.getByText('Add another breakfast').first().click();

  await expect(page).toHaveURL(/meal-suggestion/);
});
