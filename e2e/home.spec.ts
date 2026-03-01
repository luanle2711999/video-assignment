import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows Videos header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Videos')).toBeVisible();
  });

  test('shows a table of videos', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('table')).toBeVisible();
  });
});
