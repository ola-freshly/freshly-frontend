import { test, expect } from '@playwright/test';

test.describe('Freshly login page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Login').first()).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByText('Do not have an account? Register')).toBeVisible();
  });

  test('shows validation error when login form is empty', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Login').last().click();

    await expect(page.getByText(/required|email|password/i).first()).toBeVisible();
  });
});
