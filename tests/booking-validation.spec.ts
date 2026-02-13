import { test, expect } from '@playwright/test';

test('Booking modal requires date selection', async ({ page }) => {
  const hallId = '123';
  const hallSlug = 'verification-hall';

  // Mock hall data (handles both slug and ID lookups)
  await page.route(`**/api/v1/halls/*`, async (route) => {
    const url = route.request().url();
    const isExactHall = url.endsWith(`/halls/${hallId}`) || url.endsWith(`/halls/${hallSlug}`) || url.includes(`/halls/${hallId}?`) || url.includes(`/halls/${hallSlug}?`);
    if (!isExactHall) {
      return route.continue();
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        data: {
          id: hallId,
          _id: hallId,
          name: 'Verification Hall',
          location: 'Lagos',
          capacity: 50,
          description: 'A test hall.',
          pricing: { dailyRate: 1000, hourlyRate: 100 },
          images: [],
          averageRating: 4.5,
          numReviews: 10
        }
      })
    });
  });

  await page.route('**/api/v1/halls/recommendations*', (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }), headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route(`**/api/v1/reviews/hall/${hallId}`, (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }), headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route(`**/api/v1/halls/${hallId}/unavailable-dates*`, (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }), headers: { 'Access-Control-Allow-Origin': '*' } }));

  await page.goto(`http://localhost:3001/halls/${hallSlug}`);
  await page.waitForSelector('text=Verification Hall');

  // Open booking modal
  await page.click('button:has-text("Book Now")');

  // Wait for modal
  await page.waitForSelector('text=Book Your Hall');

  // "Next" button should be disabled
  const nextButton = page.locator('form button:has-text("Next")');
  await expect(nextButton).toBeDisabled();

  // Select a date. (Clicking 30 because Jan 15 is in the past as of Jan 28, 2026)
  await page.locator('form .rdp-day').filter({ hasText: /^30$/ }).click();

  // "Next" button should now be enabled
  await expect(nextButton).toBeEnabled();

  await page.screenshot({ path: '/home/jules/verification/booking_modal_enabled_next.png' });
});
