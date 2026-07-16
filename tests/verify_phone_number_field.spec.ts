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

test('Verify default Phone Number registration field type is "number"', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  // Goto create page
  await page.goto('http://localhost:3000/organizer/dashboard/events/create');

  // Wait for hydration and page to be ready
  await page.waitForTimeout(5000);

  // Wait for page to load and Next button to be stable
  const nextButton = page.locator('button:has-text("Next")').first();
  await nextButton.waitFor({ state: 'visible' });
  await nextButton.click(); // Now on sub-step 2

  // Verify "Custom Registration Fields" section is present
  await page.waitForSelector('text=Custom Registration Fields');

  // Locate the specific field card matching Phone Number using .group class
  const selectElement = page.locator('div.group:has(input[value="Phone Number"]) select').first();
  await selectElement.waitFor({ state: 'visible' });
  await expect(selectElement).toHaveValue('number');

  // Take screenshot for verification
  await page.screenshot({ path: 'verify_phone_number_field.png', fullPage: true });
});

test('Verify trash/delete button is visible on mobile and hover-only on desktop', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  // Set desktop viewport size
  await page.setViewportSize({ width: 1280, height: 800 });

  // Goto create page
  await page.goto('http://localhost:3000/organizer/dashboard/events/create');

  // Wait for hydration and page to be ready
  await page.waitForTimeout(5000);

  // Go to sub-step 2
  const nextButton = page.locator('button:has-text("Next")').first();
  await nextButton.click();

  // Locate the trash/delete button for the Phone Number field
  const fieldContainer = page.locator('div.group:has(input[value="Phone Number"])').first();
  const deleteButton = fieldContainer.locator('button:has(svg.lucide-trash-2)').first();
  await deleteButton.waitFor({ state: 'attached' });

  // On desktop
  const desktopOpacity = await deleteButton.evaluate((el) => {
    return window.getComputedStyle(el).opacity;
  });
  console.log(`Desktop computed opacity: "${desktopOpacity}"`);

  // Change viewport to mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);

  const mobileOpacity = await deleteButton.evaluate((el) => {
    return window.getComputedStyle(el).opacity;
  });
  console.log(`Mobile computed opacity: "${mobileOpacity}"`);

  expect(mobileOpacity).toBe('1');
  expect(desktopOpacity).toBe('0');

  // Take mobile screenshot
  await page.screenshot({ path: 'verify_delete_button_mobile.png' });
});
