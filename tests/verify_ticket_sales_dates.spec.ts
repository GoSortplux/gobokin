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

test('Verify ticket sales start and end dates propagate and default correctly', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  // Set standard desktop viewport size
  await page.setViewportSize({ width: 1280, height: 1000 });

  // Goto create page
  await page.goto('http://localhost:3000/organizer/dashboard/events/create');

  // Wait for hydration and page to be ready
  await page.waitForTimeout(5000);

  // Fill in the event End Date (Event Concludes)
  const eventEndDateInput = page.locator('input[name="endDate"]');
  await eventEndDateInput.waitFor({ state: 'visible' });

  // Set a specific end date/time
  const targetEndDate = '2026-12-31T23:59';
  await eventEndDateInput.fill(targetEndDate);
  await eventEndDateInput.blur();
  await page.waitForTimeout(1000);

  // Click Next to go to sub-step 2 of Details where Event Configuration collapsible header is shown
  const nextButton = page.locator('button:has-text("Next")').first();
  await nextButton.waitFor({ state: 'visible' });
  await nextButton.click(); // Now on sub-step 2 of Details
  await page.waitForTimeout(2000);

  // Verify that the attention drawing elements are visible
  const expandBadge = page.locator('text=Expand for Settings');
  await expect(expandBadge).toBeVisible();

  const clickToExpandText = page.locator('text=Click to Expand');
  await expect(clickToExpandText).toBeVisible();

  // Scroll Event Configuration header into view and capture screenshot
  await expandBadge.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/verify_event_configuration_attention.png' });

  // Directly set currentStep to 2 (Ticketing) using window.setCurrentStep helper
  await page.evaluate(() => {
    const win = window as typeof window & { setCurrentStep?: (step: number) => void };
    if (typeof win.setCurrentStep === 'function') {
      win.setCurrentStep(2);
    }
  });
  await page.waitForTimeout(2000);

  // Verify the default "General Admission" ticket's Sales End Date is updated to targetEndDate
  const firstSalesEndDate = page.locator('div.space-y-2').filter({ has: page.locator('label:has-text("Sales End Date")') }).locator('input[type="datetime-local"]').first();
  await firstSalesEndDate.waitFor({ state: 'visible' });
  await expect(firstSalesEndDate).toHaveValue(targetEndDate);

  // Verify the Sales Start Date is not empty (it has the current date/time)
  const firstSalesStartDate = page.locator('div.space-y-2').filter({ has: page.locator('label:has-text("Sales Start Date")') }).locator('input[type="datetime-local"]').first();
  await expect(firstSalesStartDate).not.toHaveValue('');

  // Scroll the dates section into view
  await firstSalesEndDate.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take a screenshot of the ticketing step with dates visible for visual confirmation
  await page.screenshot({ path: 'tests/verify_ticket_sales_dates.png' });
});
