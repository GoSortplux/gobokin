import { test } from '@playwright/test';

test.describe('Events Page and Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock session for auth-related components if needed
    await page.addInitScript(() => {
      const mockToken = btoa(JSON.stringify({
        _id: '60d5ecb8b391640015f32e56',
        email: 'organizer@example.com',
        role: ['ORGANIZER'],
        activeRole: 'ORGANIZER',
        hasAcceptedLatestPolicies: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      window.localStorage.setItem('token', mockToken);
      window.localStorage.setItem('user', JSON.stringify({
        _id: '60d5ecb8b391640015f32e56',
        email: 'organizer@example.com',
        role: ['ORGANIZER'],
        hasAcceptedLatestPolicies: true
      }));
    });
  });

  test('Event Detail Page layout', async ({ page }) => {
    // We'll use a dummy ID that our mock handlers (if any) or the page can handle
    // Since we don't have a real backend, we'll just check if the components render
    await page.goto('http://localhost:3005/events/123e4567-e89b-12d3-a456-426614174000');

    // Wait for the detail content
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'event_detail_page.png', fullPage: true });
  });

  test('Organizer Dashboard Event Detail Buttons', async ({ page }) => {
    await page.goto('http://localhost:3005/organizer/dashboard/events/123e4567-e89b-12d3-a456-426614174000');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'organizer_dashboard_detail.png', fullPage: true });
  });
});
