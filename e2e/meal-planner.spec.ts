import { test, expect } from '@playwright/test';

test('shows planned meals and opens meal suggestion', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('freshly_access_token', 'e2e-access-token');
    window.localStorage.setItem('freshly_refresh_token', 'e2e-refresh-token');
  });

  const today = new Date().toISOString().slice(0, 10);

  await page.route('http://localhost:3000/meal-plan-items*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'item-1',
            mealPlanId: 'plan-1',
            recipeId: 'recipe-1',
            mealDate: today,
            mealType: 'breakfast',
            recipe: { title: 'Greek Yogurt & Berry Bowl', cookTime: 10, calories: 350 },
          },
          {
            id: 'item-2',
            mealPlanId: 'plan-1',
            recipeId: 'recipe-2',
            mealDate: today,
            mealType: 'lunch',
            recipe: { title: 'Grilled Chicken Salad', cookTime: 20, calories: 480 },
          },
          {
            id: 'item-3',
            mealPlanId: 'plan-1',
            recipeId: 'recipe-3',
            mealDate: today,
            mealType: 'dinner',
            recipe: { title: 'Shrimp Tom Yum Soup', cookTime: 30, calories: 420 },
          },
          {
            id: 'item-4',
            mealPlanId: 'plan-1',
            recipeId: 'recipe-4',
            mealDate: today,
            mealType: 'snack',
            recipe: { title: 'Avocado Toast', cookTime: 5, calories: 330 },
          },
        ]),
      });
      return;
    }
    await route.continue();
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
