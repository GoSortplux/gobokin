import { test, expect } from '@playwright/test';

test('Verify Venue Detail changes', async ({ page }) => {
  // We can't easily mock the API response for the server-side fetch in Next.js without more setup,
  // but we can test the client-side components if they load.
  // Since we don't have a real venue ID that returns the new fields,
  // we'll try to navigate to a venue page and see if the base elements are there.

  await page.goto('http://localhost:3000/venues/test-venue');

  // Wait for the page to load (it might show an error state if venue doesn't exist)
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/home/jules/verification/venue_detail.png', fullPage: true });
});
