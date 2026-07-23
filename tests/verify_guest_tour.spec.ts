import { test, expect } from '@playwright/test';

const setupGuestMocks = async (page) => {
  // Ensure no user/auth token exists in localStorage, and clear previous drafts or completed tours
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  // Mock API responses for ALL calls to prevent 401s
  await page.route('**/api/v1/users/me', async route => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    });
  });

  await page.route('**/api/v1/notifications', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/v1/events/utils/categories', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: ['Conference', 'Workshop'] }),
    });
  });

  await page.route('**/api/v1/policies', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
};

test('Verify guest tour starts on /host-event', async ({ page }) => {
  await setupGuestMocks(page);

  // Set standard desktop viewport size
  await page.setViewportSize({ width: 1280, height: 1000 });

  // Goto /host-event
  await page.goto('http://localhost:3000/host-event');

  // Wait for the page and driver.js elements to be present
  await page.waitForTimeout(4000);

  // Check that driver.js popover has appeared
  const popover = page.locator('.driver-popover');
  await expect(popover).toBeVisible();

  // Verify the title of the first step of the guest tour is present
  const popoverTitle = page.locator('.driver-popover-title');
  await expect(popoverTitle).toContainText('Start Your Creation!');

  const popoverDescription = page.locator('.driver-popover-description');
  await expect(popoverDescription).toContainText('Welcome to the Gobokin Event Hosting setup!');

  // Capture screenshot of the first step of the guest tour
  await page.screenshot({ path: 'public/verify_guest_tour_step1.png' });

  // Click 'Next' button inside the popover
  const nextBtn = page.locator('.driver-popover-next-btn');
  await nextBtn.click();
  await page.waitForTimeout(1000);

  // Verify second step
  await expect(popoverTitle).toContainText('Draft Unauthenticated');
  await expect(popoverDescription).toContainText('Enter your event name, category, and formats here.');

  // Capture screenshot of the second step of the guest tour
  await page.screenshot({ path: 'public/verify_guest_tour_step2.png' });

  // Click 'Next' button to transition to third step
  await nextBtn.click();
  await page.waitForTimeout(1000);

  // Verify third step
  await expect(popoverTitle).toContainText('Real-time Live Preview');
  await expect(popoverDescription).toContainText('See exactly how your custom layout, tickets, agenda, and speakers will look');

  // Capture screenshot of the third step of the guest tour
  await page.screenshot({ path: 'public/verify_guest_tour_step3.png' });

  // Complete the tour by clicking "Done"
  const doneBtn = page.locator('.driver-popover-close-btn');
  await doneBtn.click();
  await page.waitForTimeout(1000);

  // Confirm popover is destroyed
  await expect(popover).not.toBeVisible();
});
