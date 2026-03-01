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
      {
        id: 2,
        catIds: [2],
        name: 'Another Video',
        formats: { one: { res: '720p', size: 500 } },
        releaseDate: '2020-01-01',
      },
    ],
  },
];

test.describe('Delete video flow', () => {
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

  test('can delete a video and it is removed from the table', async ({ page }) => {
    // --- Mock PATCH /authors/1 — simulates removing video id=1 ---
    await page.route('**/authors/1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}');
        const updatedVideos = body.videos ?? [];
        // Swap GET /authors to return the updated list (without deleted video)
        await page.unroute('**/authors');
        await page.route('**/authors', (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ ...MOCK_AUTHORS[0], videos: updatedVideos }]),
          })
        );
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_AUTHORS[0], videos: updatedVideos }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS[0]) });
      }
    });

    await page.goto('/');

    // Both videos should be visible initially
    await expect(page.locator('table')).toContainText('Set the Moon');
    await expect(page.locator('table')).toContainText('Another Video');

    // Click Delete on the first video row
    await page.getByRole('button', { name: 'Delete' }).first().click();

    // Confirm the deletion — okText is "Yes" per PopConfirm in VideosTable
    await page.getByRole('button', { name: 'Yes' }).click();

    // Deleted video should be gone from the table
    await expect(page.locator('table')).not.toContainText('Set the Moon', { timeout: 5000 });

    // The other video should still be there
    await expect(page.locator('table')).toContainText('Another Video');
  });

  test('can cancel deletion and the video remains in the table', async ({ page }) => {
    await page.goto('/');

    // Both videos should be visible
    await expect(page.locator('table')).toContainText('Set the Moon');

    // Click Delete on the first video row
    await page.getByRole('button', { name: 'Delete' }).first().click();

    // Cancel the confirmation — cancelText is "No" per PopConfirm in VideosTable
    await page.getByRole('button', { name: 'No' }).click();

    // Video should still be in the table
    await expect(page.locator('table')).toContainText('Set the Moon');
  });

  test('can delete one of multiple videos and the rest remain', async ({ page }) => {
    // --- Mock PATCH /authors/1 — simulates removing video id=2 ---
    await page.route('**/authors/1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}');
        const updatedVideos = body.videos ?? [];
        await page.unroute('**/authors');
        await page.route('**/authors', (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ ...MOCK_AUTHORS[0], videos: updatedVideos }]),
          })
        );
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_AUTHORS[0], videos: updatedVideos }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUTHORS[0]) });
      }
    });

    await page.goto('/');

    // Delete the second video ("Another Video")
    await page.getByRole('button', { name: 'Delete' }).nth(1).click();

    // Confirm with "Yes"
    await page.getByRole('button', { name: 'Yes' }).click();

    // "Another Video" should be gone
    await expect(page.locator('table')).not.toContainText('Another Video', { timeout: 5000 });

    // "Set the Moon" should still be there
    await expect(page.locator('table')).toContainText('Set the Moon');
  });
});
