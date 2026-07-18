import { test, expect } from '@playwright/test';

test('Event banner has view mode and triggers MediaViewerModal on click', async ({ page }) => {
  // Mock API requests
  await page.route('https://dev.gobokin.com/api/v1/events/e/test-organizer/test-event', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'test-event-id',
          _id: 'test-event-id',
          organizerId: 'test-organizer-id',
          title: 'Awesome Tech Gathering 2026',
          description: 'A great event for developers and tech enthusiasts to meet up.',
          category: 'Technology',
          type: 'PHYSICAL',
          status: 'PUBLISHED',
          startDate: '2026-07-11T10:00:00.000Z',
          endDate: '2026-07-13T18:00:00.000Z',
          bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
          mediaUrls: [
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60'
          ],
          location: 'Vantage Point Hub, Lagos',
          capacity: 500,
          slug: 'test-event',
          isPublished: true,
          isPublic: true,
          isFeatured: false,
          isPromoted: false,
          registrationMode: 'FULL_DETAILS',
          isGroupingEnabled: false,
          enforceUniqueGroupNames: false,
          isDeleted: false,
          organizer: {
            id: 'test-organizer-id',
            mongoUserId: 'some-user-id',
            slug: 'test-organizer',
            status: 'APPROVED',
            isVerified: true,
            organizerStatus: 'VERIFIED',
            userProfile: {
              _id: 'some-user-id',
              fullName: 'Lagos Tech Hubs',
              email: 'contact@lagostechhubs.com'
            }
          },
          tickets: [
            {
              id: 'ticket-1',
              name: 'General Admission',
              price: 15000,
              type: 'PAID',
              allocationType: 'GENERAL',
              totalQuantity: 100,
              availableQuantity: 50,
              remainingTickets: 50,
              maxPerOrder: 5,
              isOffline: false,
              groupSize: 1
            }
          ]
        }
      })
    });
  });

  await page.route('https://dev.gobokin.com/api/v1/events/my-registrations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] })
    });
  });

  // Navigate to the test event detail page
  await page.goto('http://localhost:3000/events/test-organizer/test-event');

  // Verify the page has loaded successfully
  await expect(page.locator('h1')).toContainText('Awesome Tech Gathering 2026');

  // Find the active visible slide image
  const bannerImgContainer = page.locator('.banner-slider-container .slick-active img').first();
  await expect(bannerImgContainer).toBeVisible();

  // Click on the active banner image to open the media viewer
  await bannerImgContainer.click();

  // MediaViewerModal should now be visible
  const modal = page.locator('div[role="dialog"]');
  await expect(modal).toBeVisible();

  // Take screenshot to verify modal is open
  await page.screenshot({ path: 'verify_event_banner_view.png' });

  // Close the modal
  const closeButton = modal.locator('button[aria-label="Close"]');
  await closeButton.click();

  // Modal should be closed/hidden
  await expect(modal).not.toBeVisible();
});
