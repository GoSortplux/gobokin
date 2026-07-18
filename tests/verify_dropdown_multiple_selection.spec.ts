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

test('Verify registration dropdown field option enhancements and multiple selection toggle', async ({ page }) => {
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

  // Add a new custom registration field by clicking "Add Field" to open the dropdown
  const addFieldButton = page.locator('button:has-text("Add Field")').first();
  await addFieldButton.waitFor({ state: 'visible' });
  await addFieldButton.click();
  await page.waitForTimeout(500);

  // Click "Empty Field" to trigger custom field addition
  const emptyFieldBtn = page.locator('button:has-text("Empty Field")').first();
  await emptyFieldBtn.waitFor({ state: 'visible' });
  await emptyFieldBtn.click();
  await page.waitForTimeout(1000);

  // Locate the new field container using the Field Label input placeholder and li tag
  const lastFieldContainer = page.locator('li').filter({ has: page.locator('input[placeholder="e.g., Job Title"]') }).first();
  await lastFieldContainer.waitFor({ state: 'visible' });

  // Select input type dropdown (select) for the newly added custom field
  const newTypeSelect = lastFieldContainer.locator('label:has-text("Input Type") + div select');
  await newTypeSelect.selectOption('select');
  await page.waitForTimeout(1500);

  // Verify that "Choice Source" is NOT visible for this new field
  const fieldChoiceSource = lastFieldContainer.locator('label:has-text("Choice Source")');
  await expect(fieldChoiceSource).not.toBeVisible();

  // Verify that the larger "Add Option" button is visible and click it
  const addOptionButton = lastFieldContainer.locator('button:has-text("Add Option")');
  await expect(addOptionButton).toBeVisible();
  await addOptionButton.click();
  await page.waitForTimeout(500);

  // Verify that a larger Option input is added
  const optionInput = lastFieldContainer.locator('input[placeholder="Option Name"]').first();
  await expect(optionInput).toBeVisible();
  await optionInput.fill('VIP Option');

  // Verify that the "Select Multiple Options" toggle switch is visible
  const selectMultipleToggle = lastFieldContainer.locator('text=Select Multiple Options');
  await expect(selectMultipleToggle).toBeVisible();

  const toggleCheckbox = lastFieldContainer.locator('input[type="checkbox"]').last();
  await expect(toggleCheckbox).not.toBeChecked();
  await toggleCheckbox.click({ force: true });
  await expect(toggleCheckbox).toBeChecked();

  // Scroll into view of our new field and capture a screenshot
  await lastFieldContainer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/verify_dropdown_multiple_selection.png' });
});
