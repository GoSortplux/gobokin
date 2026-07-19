import { test, expect } from '@playwright/test';

const setupLocalStorageAndMocks = async (page) => {
  // Inject auth into localStorage and clear previous state/drafts
  await page.addInitScript(() => {
    window.localStorage.clear();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjpbIm9yZ2FuaXplciJdLCJhY3RpdmVSb2xlIjoib3JnYW5pemVyIiwiaGFzQWNjZXB0ZWRMYXRlc3RQb2xpY2llcyI6dHJ1ZSwiaGFzQWNjZXB0ZWRIYWxsT3duZXJQb2xpY3kiOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify({
      id: 'user-1',
      _id: 'user-1',
      role: ['organizer'],
      activeRole: 'organizer',
      email: 'test@example.com',
      hasAcceptedLatestPolicies: true,
      hasAcceptedHallOwnerPolicy: true
    }));
    window.localStorage.setItem('lastActivity', Date.now().toString());
  });

  // Mock API responses for ALL calls to prevent 401s and Session Expired dialog
  await page.route('**/api/v1/users/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'user-1',
          _id: 'user-1',
          role: ['organizer'],
          activeRole: 'organizer',
          hasAcceptedLatestPolicies: true,
          hasAcceptedHallOwnerPolicy: true
        }
      }),
    });
  });

  await page.route('**/api/v1/notifications', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/v1/events/my-organizer-profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { slug: 'test-org' } }),
    });
  });

  await page.route('**/api/v1/events/my-events', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/v1/events/my-organizer-profile/rules', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/v1/policies', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/v1/policies/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    });
  });

  await page.route('**/api/v1/events/utils/categories', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: ['Conference', 'Workshop'] }),
    });
  });
};

test('Verify mobile click on Info icon shows tooltip and does NOT toggle checkbox', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  // Set mobile viewport size
  await page.setViewportSize({ width: 375, height: 667 });

  // Goto create page
  await page.goto('http://localhost:3000/organizer/dashboard/events/create');

  // Wait for hydration and page to be ready
  await page.waitForTimeout(5000);

  // Click Next to go to sub-step 2 of Details where Custom Registration Fields are shown
  const nextButton = page.locator('button:has-text("Next")').first();
  await nextButton.waitFor({ state: 'visible' });
  await nextButton.click(); // Now on sub-step 2 of Details
  await page.waitForTimeout(2000);

  // Locate Full Name field
  const fullNameField = page.locator('li').filter({ has: page.locator('input[value="Full Name"]') }).first();
  await fullNameField.waitFor({ state: 'visible' });

  // Locate the checkbox
  const checkbox = fullNameField.locator('input[type="checkbox"]').nth(1); // Per Attendee checkbox is the second checkbox on the list item (Mandatory is the first)
  const initialChecked = await checkbox.isChecked();

  // Locate the Info button
  const infoButton = fullNameField.locator('button:has(svg.lucide-info)').first();
  await expect(infoButton).toBeVisible();

  // Click the Info button
  await infoButton.click();
  await page.waitForTimeout(500);

  // Verify that the checkbox remains in its initial state (does NOT toggle)
  const afterChecked = await checkbox.isChecked();
  expect(afterChecked).toBe(initialChecked);

  // Verify that the tooltip is shown (via focus-within class/styling)
  const tooltipTextContainer = fullNameField.locator('.absolute.bottom-full').first();
  await expect(tooltipTextContainer).toBeVisible();

  // Take screenshot for mobile verification
  await page.screenshot({ path: '/home/jules/verification/mobile_tooltip_non_toggle.png' });
});
