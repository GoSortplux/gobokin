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
      body: JSON.stringify({
        data: [
          {
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
            analytics: { impressions: 1250 }
          }
        ]
      }),
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

test('Verify organizer dashboard event cards show full-width Manage Event button without companion delete button', async ({ page }) => {
  await setupLocalStorageAndMocks(page);

  // Set standard desktop viewport size
  await page.setViewportSize({ width: 1280, height: 1000 });

  // Goto dashboard events page
  await page.goto('http://localhost:3000/organizer/dashboard/events');

  // Wait for hydration and page to be ready
  await page.waitForTimeout(5000);

  // Assert grid item of event is loaded
  const eventGrid = page.locator('#organizer-events-grid');
  await expect(eventGrid).toBeVisible();

  const eventCard = eventGrid.locator('.group').first();
  await expect(eventCard).toBeVisible();

  // Find the Manage Event button
  const manageEventButton = eventCard.locator('a:has-text("Manage Event")');
  await expect(manageEventButton).toBeVisible();

  // Assert that there is NO companion trash/delete button right next to it (with class bg-rose-50 / text-rose-600)
  const companionTrashBtn = eventCard.locator('.w-14.h-14.bg-rose-50');
  await expect(companionTrashBtn).not.toBeVisible();

  // Highlight or scroll into view
  await eventCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/verify_organizer_event_cards.png' });
});
