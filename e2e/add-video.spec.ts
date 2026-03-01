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
        catIds: [1, 2],
        name: 'Set the Moon',
        formats: { one: { res: '1080p', size: 1000 } },
        releaseDate: '2018-08-09',
      },
    ],
  },
];

test.describe('Add video flow', () => {
  test('can add a new video and see it in the table', async ({ page }) => {
    const videoName = `E2E Test Video ${Date.now()}`;

    // --- Mock GET /categories ---
    await page.route('**/categories', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CATEGORIES) })
    );

    // --- Mock GET /authors and GET /authors/:id ---
    await page.route('**/authors/**', (route) => {
      // GET /authors/1
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS[0]) });
    });

    await page.route('**/authors', (route) => {
      if (route.request().method() === 'GET') {
        // GET /authors  — used to load the table and compute new video id
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });

    // --- Mock PATCH /authors/:id (addVideo writes back here) ---
    let patchedVideos: unknown[] = [];
    await page.route('**/authors/1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}');
        patchedVideos = body.videos ?? [];
        // After the PATCH, subsequent GET /authors should return the updated data
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

    // Open Add Video modal
    await page.getByRole('button', { name: 'Add video' }).click();

    // Wait for modal title
    const modalTitle = page.locator('#modal-title');
    await expect(modalTitle).toBeVisible();

    // Fill video name
    const nameInput = page.locator('input[placeholder="Enter video name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(videoName);

    // Select author (first select)
    const selects = page.locator('[data-testid="select-root"]');
    await selects.nth(0).click();
    const authorOption = page.locator('[data-testid="select-option-1"]');
    await expect(authorOption).toBeVisible();
    await authorOption.click();

    // Select categories (second select, multiple)
    await selects.nth(1).click();
    const catOption1 = page.locator('[data-testid="select-option-1"]');
    await expect(catOption1).toBeVisible();
    await catOption1.click();
    const catOption2 = page.locator('[data-testid="select-option-2"]');
    await expect(catOption2).toBeVisible();
    await catOption2.click();

    // Close any open dropdowns by clicking the modal title (avoids Escape which closes the modal)
    await page.locator('#modal-title').click();
    await page.waitForTimeout(200);

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Expect the new video to appear in the table
    await expect(page.locator('table')).toContainText(videoName, { timeout: 5000 });
  });
});
