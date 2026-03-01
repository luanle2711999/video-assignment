/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

const MOCK_CATEGORIES = [
  { id: 1, name: 'Thriller' },
  { id: 2, name: 'Crime' },
];

const MOCK_AUTHORS = [
  {
    id: 1,
    name: 'David Munch',
    videos: [
      {
        id: 1,
        catIds: [1],
        name: 'Set the Moon',
        formats: { one: { res: '1080p', size: 1000 } },
        releaseDate: '2018-08-09',
      },
    ],
  },
];

test.describe('Edit video flow', () => {
  test.beforeEach(async ({ page }) => {
    // --- Mock GET /categories ---
    await page.route('**/categories', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CATEGORIES) })
    );

    // --- Mock GET /authors/:id ---
    await page.route('**/authors/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS[0]) })
    );

    // --- Mock GET /authors ---
    await page.route('**/authors', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS) })
    );
  });

  test('can open the edit modal with pre-filled values', async ({ page }) => {
    await page.goto('/');

    // Click the Edit button on the first row
    await page.getByRole('button', { name: 'Edit' }).first().click();

    // Modal should be visible
    const modalTitle = page.locator('#modal-title');
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toContainText(/edit/i);

    // Video name input should be pre-filled
    const nameInput = page.locator('input[placeholder="Enter video name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('Set the Moon');
  });

  test('can edit the video name and see the updated name in the table', async ({ page }) => {
    const updatedName = `Updated Video ${Date.now()}`;

    // --- Mock PATCH /authors/1 and swap out GET /authors to return updated data ---
    let patchedVideos: unknown[] = [];
    await page.route('**/authors/1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}');
        patchedVideos = body.videos ?? [];
        await page.unroute('**/authors');
        await page.route('**/authors', (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ ...MOCK_AUTHORS[0], videos: patchedVideos }]),
          })
        );
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_AUTHORS[0], videos: patchedVideos }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS[0]) });
      }
    });

    await page.goto('/');

    // Click the Edit button on the first row
    await page.getByRole('button', { name: 'Edit' }).first().click();

    // Wait for modal
    await expect(page.locator('#modal-title')).toBeVisible();

    // Clear and fill in new video name
    const nameInput = page.locator('input[placeholder="Enter video name"]');
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Close any open dropdowns by clicking the modal title
    await page.locator('#modal-title').click();
    await page.waitForTimeout(200);

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Updated name should appear in the table
    await expect(page.locator('table')).toContainText(updatedName, { timeout: 5000 });
  });

  test('can edit the video categories and see the updated categories in the table', async ({ page }) => {
    let patchedVideos: unknown[] = [];
    await page.route('**/authors/1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}');
        patchedVideos = body.videos ?? [];
        await page.unroute('**/authors');
        await page.route('**/authors', (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ ...MOCK_AUTHORS[0], videos: patchedVideos }]),
          })
        );
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_AUTHORS[0], videos: patchedVideos }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS[0]) });
      }
    });

    await page.goto('/');

    // Click the Edit button on the first row
    await page.getByRole('button', { name: 'Edit' }).first().click();

    // Wait for modal
    await expect(page.locator('#modal-title')).toBeVisible();

    // Open categories select (second select) and add "Crime"
    const selects = page.locator('[data-testid="select-root"]');
    await selects.nth(1).click();
    const catOption2 = page.locator('[data-testid="select-option-2"]');
    await expect(catOption2).toBeVisible();
    await catOption2.click();

    // Close dropdown
    await page.locator('#modal-title').click();
    await page.waitForTimeout(200);

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // "Crime" category should now appear in the table row
    await expect(page.locator('table')).toContainText('Crime', { timeout: 5000 });
  });

  test('can cancel editing and the table remains unchanged', async ({ page }) => {
    await page.goto('/');

    const originalName = 'Set the Moon';

    // Click the Edit button on the first row
    await page.getByRole('button', { name: 'Edit' }).first().click();

    // Wait for modal
    await expect(page.locator('#modal-title')).toBeVisible();

    // Change the name
    const nameInput = page.locator('input[placeholder="Enter video name"]');
    await nameInput.clear();
    await nameInput.fill('Should Not Be Saved');

    // Click Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should be gone
    await expect(page.locator('#modal-title')).not.toBeVisible();

    // Original name should still be in the table
    await expect(page.locator('table')).toContainText(originalName);
  });
});
