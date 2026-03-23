
import { test, expect } from '@playwright/test';

test('homepage displays discovery categories', async ({ page }) => {
  // Intercept the discovery API call and return mock data
  await page.route('**/api/v1/halls/discovery*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          popularVenues: [
            { id: '1', name: 'Mock Popular Venue', capacity: 100, pricing: { dailyRate: 100000 }, images: [], media: [] }
          ],
          featuredVenues: [
            { id: '2', name: 'Mock Featured Venue', capacity: 200, pricing: { dailyRate: 200000 }, images: [], media: [] }
          ]
        }
      })
    });
  });

  // Intercept the /halls call (fallback) but ensure it's not used when discovery has data
  await page.route('**/api/v1/halls', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: '3', name: 'Manual Fallback Venue', capacity: 600, pricing: { dailyRate: 50000 }, createdAt: new Date().toISOString(), images: [], media: [] }
        ]
      })
    });
  });

  await page.goto('http://localhost:3000');

  // Wait for the mock popular venue to appear
  await expect(page.locator('text=Mock Popular Venue').first()).toBeVisible();

  // Verify discovery categories are present
  await expect(page.locator('text=Popular Venues')).toBeVisible();
  await expect(page.locator('text=Featured Venues')).toBeVisible();

  // Verify manual fallbacks are NOT present (e.g., "Large Capacity Venues" or "Manual Fallback Venue")
  await expect(page.locator('text=Large Capacity Venues')).not.toBeVisible();
  await expect(page.locator('text=Manual Fallback Venue').first()).not.toBeVisible();
});

test('homepage displays fallbacks when discovery API returns empty', async ({ page }) => {
  // Intercept the discovery API call and return empty data
  await page.route('**/api/v1/halls/discovery*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {}
      })
    });
  });

  // Intercept the /halls call and return data that will trigger fallbacks
  await page.route('**/api/v1/halls', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: '3',
            name: 'Manual Fallback Venue',
            capacity: 600,
            pricing: { dailyRate: 50000 },
            createdAt: new Date().toISOString(),
            images: [],
            media: [],
            location: 'Lagos',
            slug: 'manual-fallback-venue'
          }
        ]
      })
    });
  });

  await page.goto('http://localhost:3000');

  // Wait for the fallback to appear
  await expect(page.locator('text=Large Capacity Venues')).toBeVisible();
  await expect(page.locator('text=Manual Fallback Venue').first()).toBeVisible();
});
