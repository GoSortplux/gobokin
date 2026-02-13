import { test, expect } from '@playwright/test';

test('Contact Owner button requires login', async ({ page }) => {
  const hallId = '123';
  const hallSlug = 'verification-hall';

  // Combined mock for hall data and OPTIONS (handles both slug and ID lookups)
  await page.route(`**/api/v1/halls/*`, async (route) => {
    const url = route.request().url();
    const isExactHall = url.endsWith(`/halls/${hallId}`) || url.endsWith(`/halls/${hallSlug}`) || url.includes(`/halls/${hallId}?`) || url.includes(`/halls/${hallSlug}?`);
    if (!isExactHall) {
      return route.continue();
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } else {
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
            numReviews: 10,
            directionUrl: 'https://maps.google.com'
          }
        })
      });
    }
  });

  // Mock recommendations, reviews and unavailable dates
  await page.route('**/api/v1/halls/recommendations*', (route) => route.fulfill({
    status: 200,
    body: JSON.stringify({ data: [] }),
    headers: { 'Access-Control-Allow-Origin': '*' }
  }));
  await page.route(`**/api/v1/reviews/hall/${hallId}`, (route) => route.fulfill({
    status: 200,
    body: JSON.stringify({ data: [] }),
    headers: { 'Access-Control-Allow-Origin': '*' }
  }));
  await page.route(`**/api/v1/halls/${hallId}/unavailable-dates*`, (route) => route.fulfill({
    status: 200,
    body: JSON.stringify({ data: [] }),
    headers: { 'Access-Control-Allow-Origin': '*' }
  }));

  // Go to hall detail page (unauthenticated)
  await page.goto(`http://localhost:3001/halls/${hallSlug}`);

  // Wait for hall data to load
  await page.waitForSelector('text=Verification Hall', { timeout: 15000 });

  // Click "Contact Owner"
  await page.click('button:has-text("Contact Owner")');

  // Check if SweetAlert appears
  const swalTitle = await page.locator('.swal2-title');
  await expect(swalTitle).toHaveText('Want to reach out to the owner?');

  const swalText = await page.locator('.swal2-html-container');
  await expect(swalText).toHaveText('Please log in to view the contact details.');

  await page.screenshot({ path: '/home/jules/verification/contact_owner_auth_prompt.png' });
});
