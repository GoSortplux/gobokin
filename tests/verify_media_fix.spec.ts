import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Verify venue media display', async ({ page }) => {
  // Go to a known venue with video (using the slug from previous discovery)
  await page.goto(`${BASE_URL}/venues/m-and-m-event-center-1740523030238`);

  // Wait for images/videos to load
  await page.waitForTimeout(5000);

  // Check for the media gallery
  const gallery = page.locator('.grid-cols-1.md\\:grid-cols-2.md\\:grid-rows-2');
  await expect(gallery).toBeVisible();

  // Take screenshot of the gallery
  await gallery.screenshot({ path: 'venue_detail_media_updated.png' });

  // Click on the first media item to open viewer
  await gallery.locator('div.cursor-pointer').first().click();

  // Wait for modal
  const modal = page.locator('div[role="dialog"]');
  await expect(modal).toBeVisible();
  await page.waitForTimeout(2000);

  // Take screenshot of modal
  await modal.screenshot({ path: 'media_viewer_modal_updated.png' });

  // Check for thumbnails in modal
  const thumbnails = modal.locator('button.relative.w-16');
  await expect(thumbnails.first()).toBeVisible();

  // Take screenshot of thumbnails
  await thumbnails.first().screenshot({ path: 'media_viewer_thumbnail_updated.png' });
});

test('Verify venue card media display', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.waitForTimeout(5000);

  const venueCard = page.locator('[data-testid="venue-card"]').first();
  await expect(venueCard).toBeVisible();

  await venueCard.screenshot({ path: 'venue_card_media_updated.png' });
});
