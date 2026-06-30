import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Verify organizer edit event registration fields are draggable and grouped', async ({ page }) => {
  // Mock event data
  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Event',
    isGroupingEnabled: true,
    registrationFields: [
      { id: '1', name: 'Group Name', label: 'Group Name', type: 'text', required: true, isPerAttendee: false, order: 0 },
      { id: '2', name: 'Group Size', label: 'Group Size', type: 'number', required: true, isPerAttendee: false, order: 1 },
      { id: '3', name: 'Attendee Meal', label: 'Attendee Meal', type: 'text', required: false, isPerAttendee: true, order: 2 },
    ]
  };

  // Mock API responses
  await page.route('**/api/v1/events/test-event-id', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockEvent }),
    });
  });

  await page.route('**/api/v1/users/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'user-1', role: ['organizer'], activeRole: 'organizer' } }),
    });
  });

  // Inject auth into localStorage
  await page.addInitScript(() => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjpbIm9yZ2FuaXplciJdLCJhY3RpdmVSb2xlIjoib3JnYW5pemVyIiwiaGFzQWNjZXB0ZWRMYXRlc3RQb2xpY2llcyI6dHJ1ZSwiaGFzQWNjZXB0ZWRIYWxsT3duZXJQb2xpY3kiOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify({
      id: 'user-1',
      _id: 'user-1',
      role: ['organizer'],
      activeRole: 'organizer',
      email: 'test@example.com'
    }));
    window.localStorage.setItem('lastActivity', Date.now().toString());
  });

  await page.goto('http://localhost:3000/organizer/dashboard/events/test-event-id/edit');

  // Wait for the loader to disappear
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 30000 });

  // Click on "Registration" tab/step if needed.
  // Based on the code, it's step 3.
  // Let's look for "Registration" text in the sidebar or navigation.
  await page.click('text=Registration');

  // Wait for the sections to appear
  await page.waitForSelector('text=Group Information');
  await page.waitForSelector('text=Attendee Information');

  // Check for drag handles (GripVertical icon should be present)
  // We can look for the SVG or a container
  const dragHandles = await page.locator('svg.lucide-grip-vertical').count();
  console.log(`Found ${dragHandles} drag handles`);

  // Take screenshot
  await page.screenshot({ path: '/home/jules/verification/edit_registration_fields.png', fullPage: true });

  expect(dragHandles).toBeGreaterThan(0);
});
