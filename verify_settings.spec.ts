import { test, expect } from '@playwright/test';

test('Organizer Settings Page UI', async ({ page }) => {
  // Mock localStorage for auth
  await page.addInitScript(() => {
    const fakeToken = "header." + btoa(JSON.stringify({
      _id: "60d5ecb8b391640015f32e56",
      email: "organizer@example.com",
      role: ["organizer"],
      activeRole: "organizer",
      hasAcceptedLatestPolicies: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    })) + ".signature";

    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify({
      _id: "60d5ecb8b391640015f32e56",
      fullName: "Test Organizer",
      email: "organizer@example.com",
      hasAcceptedLatestPolicies: true,
      activeRole: "organizer"
    }));
  });

  // Mock API responses
  await page.route('**/api/v1/users/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { _id: "60d5ecb8b391640015f32e56", fullName: "Test Organizer", role: ["organizer"], activeRole: "organizer" } })
    });
  });

  await page.route('**/api/v1/events/my-organizer-profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          slug: "tech-org",
          status: "ESTABLISHED",
          isVerified: true,
          bio: "Leading tech event organizer.",
          website: "https://techorganizer.com",
          commissionRate: 5,
          maxStaff: 10,
          defaultRefundType: "PARTIAL",
          defaultRefundPercentage: 80,
          defaultRefundCutoffDays: 7,
          wallet: {
            pendingBalance: 150000.5,
            availableBalance: 75200,
            currency: "NGN"
          }
        }
      })
    });
  });

  await page.route('**/api/v1/events/my-subscriptions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: ["PREMIUM_PLAN", "SMS_BUNDLE"] })
    });
  });

  // Navigate and wait
  await page.goto('http://localhost:3000/organizer/dashboard/settings', { waitUntil: 'networkidle' });

  // Wait specifically for the loader to disappear if it exists, or just wait for the main content
  await page.waitForTimeout(5000);

  // Capture screenshot
  await page.screenshot({ path: 'settings_verified.png', fullPage: true });

  // Check for key elements
  await expect(page.locator('h1')).toContainText('Organizer Settings');
  await expect(page.getByText('Verified Organizer')).toBeVisible();
  await expect(page.getByText('tech-org')).toBeVisible();
});
