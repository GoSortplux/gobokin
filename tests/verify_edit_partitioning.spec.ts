import { test, expect } from '@playwright/test';

test('Event Edit Page - Registration Fields Partitioning and Drag-and-Drop', async ({ page }) => {
  // Set up mock auth and policies
  await page.addInitScript(() => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      firstName: 'Test',
      lastName: 'Organizer',
      role: ['organizer'],
      hasAcceptedLatestPolicies: true
    }));
  });

  // Intercept API calls
  await page.route('**/api/v1/events/123', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '123',
        title: 'Mock Event',
        slug: 'mock-event',
        description: 'This is a mock event',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        locationType: 'PHYSICAL',
        venueName: 'Mock Venue',
        address: '123 Mock St',
        isPublished: true,
        isGroupingEnabled: true,
        registrationFields: [
          { id: '1', label: 'Group Name', name: 'groupName', type: 'text', required: true, category: 'GROUP' },
          { id: '2', label: 'Company', name: 'company', type: 'text', required: false, category: 'GROUP' },
          { id: '3', label: 'Full Name', name: 'fullName', type: 'text', required: true, category: 'ATTENDEE' },
          { id: '4', label: 'Email', name: 'email', type: 'email', required: true, category: 'ATTENDEE' },
        ],
        tickets: [],
        categories: ['Technology'],
        bannerUrl: 'https://placehold.co/600x400',
        mediaUrls: []
      }),
    });
  });

  await page.route('**/api/v1/categories', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(['Technology', 'Business']),
    });
  });

  await page.route('**/api/v1/notifications**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  await page.route('**/api/v1/events/o/mock-event', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: '1', name: 'Mock Org' }),
    });
  });

  // Navigate to the edit page
  await page.goto('/organizer/dashboard/events/123/edit');

  // Check for the Group Information header
  const groupInfoHeader = page.getByText('Group Information');
  await expect(groupInfoHeader).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Fields collected once per group')).toBeVisible();

  // Check for Group fields
  await expect(page.getByText('Group Name')).toBeVisible();
  await expect(page.getByText('Company')).toBeVisible();

  // Check for Attendee Information header
  const attendeeInfoHeader = page.getByText('Attendee Information');
  await expect(attendeeInfoHeader).toBeVisible();
  await expect(page.getByText('Fields collected for every attendee in the group')).toBeVisible();

  // Check for Attendee fields
  await expect(page.getByText('Full Name')).toBeVisible();
  await expect(page.getByText('Email')).toBeVisible();

  // Verify presence of drag handles (Lucide grip-vertical)
  // Reorder.Item renders the items, we check for the grip icon
  const dragHandles = page.locator('svg.lucide-grip-vertical');
  await expect(dragHandles).toHaveCount(4);

  // Take a screenshot
  await page.screenshot({ path: '/home/jules/verification/edit_registration_partitioning.png', fullPage: true });
});
