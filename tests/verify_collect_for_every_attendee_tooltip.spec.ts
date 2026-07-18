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

test('Verify "Collect this for every attendee." checkbox and informative tooltip', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  // Set standard desktop viewport size
  await page.setViewportSize({ width: 1280, height: 1000 });

  // Goto create page
  await page.goto('http://localhost:3000/organizer/dashboard/events/create');

  // Wait for hydration and page to be ready
  await page.waitForTimeout(5000);

  // Click Next to go to sub-step 2 of Details where Custom Registration Fields are shown
  const nextButton = page.locator('button:has-text("Next")').first();
  await nextButton.waitFor({ state: 'visible' });
  await nextButton.click(); // Now on sub-step 2 of Details
  await page.waitForTimeout(2000);

  // First verify default "Full Name" field contains the "Collect this for every attendee." label
  const fullNameField = page.locator('li').filter({ has: page.locator('input[value="Full Name"]') }).first();
  await fullNameField.waitFor({ state: 'visible' });

  const checkboxLabel = fullNameField.locator('text="Collect this for every attendee."');
  await expect(checkboxLabel).toBeVisible();

  // Hover over the label/info area to show the tooltip
  const tooltipTrigger = fullNameField.locator('.group\\/tooltip').first();
  await tooltipTrigger.hover();
  await page.waitForTimeout(500);

  // Verify tooltip text is populated
  const tooltipTextContainer = tooltipTrigger.locator('.absolute.bottom-full');
  await expect(tooltipTextContainer).toBeVisible();

  // Under default mock conditions, Grouping is disabled so it should show: Enable 'Allow Grouping' to collect details per attendee.
  const tooltipText = await tooltipTextContainer.innerText();
  expect(tooltipText).toContain("Enable 'Allow Grouping' to collect details per attendee.");

  // Save screenshot of the highlighted tooltip
  await fullNameField.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/verify_collect_for_every_attendee_tooltip.png' });
});
