import { test, expect } from '@playwright/test';

test('Freshly web app loads successfully', async ({ page }) => {
  const pageErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto('/');

  expect(response?.ok()).toBeTruthy();

  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toBeVisible();

  const pageContent = await page.locator('body').innerText();
  expect(pageContent.trim().length).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
});
