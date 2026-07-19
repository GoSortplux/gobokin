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

  // Mock API responses
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
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  await page.route('**/api/v1/events/my-organizer-profile', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { slug: 'test-org' } }) });
  });

  await page.route('**/api/v1/events/event-101', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'event-101',
          title: 'My Exclusive Tech Summit 2026',
          description: 'The premier conference for developers.',
          startDate: '2026-12-01T10:00:00.000Z',
          endDate: '2026-12-03T18:00:00.000Z',
          status: 'UPCOMING',
          location: 'Tech Hub Arena',
          capacity: 500,
          soldQuantity: 150,
          totalRevenue: 7500000,
          isPublic: true,
          analytics: { impressions: 1250 },
          organizer: { id: 'org-1', slug: 'test-org', name: 'Test Org' },
          tickets: []
        }
      }),
    });
  });

  await page.route('**/api/v1/events/event-101/analytics', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { impressions: 120, ticketSales: 0, revenue: 0 } }) });
  });

  await page.route('**/api/v1/events/event-101/staff', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  await page.route('**/api/v1/events/event-101/waitlist', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  await page.route('**/api/v1/events/event-101/orders', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  await page.route('**/api/v1/events/event-101/registrations**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], pagination: { total: 0 } }) });
  });

  // Mock rules API to return BROADCAST_ALLOWED as restricted!
  await page.route('**/api/v1/events/my-organizer-profile/rules', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            key: 'BROADCAST_ALLOWED',
            isRestricted: true,
            value: 0,
            title: 'Guest Messaging Locked',
            uxContext: 'Keep every attendee informed...'
          }
        ]
      }),
    });
  });

  await page.route('**/api/v1/policies', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  await page.route('**/api/v1/policies/**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });
};

test('Verify friendly modal for restricted broadcast is displayed', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  await page.goto('http://localhost:3000/organizer/dashboard/events/event-101');

  // Wait for hydration and page to load
  await page.waitForTimeout(5000);

  // Click on Message Guest button
  const messageGuestBtn = page.locator('button:has-text("Message Guest")').first();
  await messageGuestBtn.waitFor({ state: 'visible' });
  await messageGuestBtn.click();

  // Wait for SweetAlert modal
  const swalPopup = page.locator('div.swal2-popup');
  await swalPopup.waitFor({ state: 'visible' });

  // Assert it has title and correct html elements
  await expect(swalPopup.locator('h2')).toContainText('Connect with Your Guests');
  await expect(swalPopup.locator('span:has-text("Premium Feature")')).toBeVisible();

  // Wait a bit for transition animations
  await page.waitForTimeout(2000);

  // Take full-page screenshot to capture the entire viewport with SweetAlert
  await page.screenshot({ path: '/home/jules/verification/friendly_error_swal.png', fullPage: true });
});
