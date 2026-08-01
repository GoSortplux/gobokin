import { test, expect } from '@playwright/test';

test('Verify Walk-in Registration displays and submits custom registration fields', async ({ page }) => {
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjpbIm9yZ2FuaXplciJdLCJhY3RpdmVSb2xlIjoib3JnYW5pemVyIiwiaGFzQWNjZXB0ZWRMYXRlc3RQb2xpY2llcyI6dHJ1ZSwiaGFzQWNjZXB0ZWRIYWxsT3duZXJQb2xpY3kiOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  // Fallback for all other API requests to avoid any 401 responses from unmocked endpoints
  await page.route('**/api/v1/**', async route => {
    const url = route.request().url();
    // Only handle if not specifically mocked below (specific matchers are registered after this fallback)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], rules: [], title: "Free Plan Account" }),
    });
  });

  // Mock event with custom registration fields
  const mockEvent = {
    id: 'test-event-id',
    title: 'Awesome Dynamic Event',
    isGroupingEnabled: false,
    registrationFields: [
      { id: '1', name: 'fullName', label: 'Guest Name', type: 'text', required: true, isPerAttendee: true, order: 0 },
      { id: '2', name: 'email', label: 'Email Address', type: 'text', required: true, isPerAttendee: true, order: 1 },
      { id: '3', name: 'phone', label: 'Phone Number', type: 'text', required: true, isPerAttendee: true, order: 2 },
      { id: '4', name: 'company', label: 'Company / Organization', type: 'text', required: true, isPerAttendee: true, order: 3 },
      { id: '5', name: 'dietary', label: 'Dietary Preference', type: 'select', options: ['None', 'Vegetarian', 'Vegan'], required: false, isPerAttendee: true, order: 4 },
    ],
    tickets: [
      { id: 'ticket-1', name: 'VIP Ticket', price: 1000, quantity: 50 },
    ]
  };

  // Mock API requests (registered after fallback to take precedence)
  await page.route('**/api/v1/events/test-event-id', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockEvent }),
    });
  });

  await page.route('**/api/v1/events/test-event-id/analytics', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    });
  });

  await page.route('**/api/v1/events/test-event-id/registrations**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

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
          email: 'test@example.com',
          hasAcceptedLatestPolicies: true
        }
      }),
    });
  });

  // Track the walk-in payload sent to the backend
  let walkInPayload: any = null;
  await page.route('**/api/v1/events/test-event-id/walk-in', async route => {
    walkInPayload = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Walk-in registration successful!' }),
    });
  });

  // Inject auth into localStorage & document.cookie and bypass redirection guard
  await page.addInitScript(({ token }) => {
    let cookieVal = `token=${token}; user=${encodeURIComponent(JSON.stringify({
      id: 'user-1',
      _id: 'user-1',
      role: ['organizer'],
      activeRole: 'organizer',
      email: 'test@example.com',
      hasAcceptedLatestPolicies: true
    }))}`;

    Object.defineProperty(document, 'cookie', {
      get: () => cookieVal,
      set: (val) => {
        cookieVal += '; ' + val;
      },
      configurable: true
    });

    window.localStorage.setItem('token', token);
    window.localStorage.setItem('user', JSON.stringify({
      id: 'user-1',
      _id: 'user-1',
      role: ['organizer'],
      activeRole: 'organizer',
      email: 'test@example.com',
      hasAcceptedLatestPolicies: true
    }));
    window.localStorage.setItem('lastActivity', Date.now().toString());
  }, { token: fakeToken });

  // Navigate directly to the event check-in/details page
  await page.goto('http://localhost:3000/organizer/dashboard/events/test-event-id?test_no_revert=true');

  // Click the attendees tab first
  await page.waitForSelector('button:has-text("attendees")', { timeout: 15000 });
  await page.click('button:has-text("attendees")');

  // Wait for page to render and trigger opening the Walk-in Registration modal
  await page.waitForSelector('text=Walk-in Registration', { timeout: 15000 });
  await page.click('text=Walk-in Registration');

  // Verify modal header is visible
  await page.waitForSelector('text=Manual Guest Entry');

  // Verify standard and custom fields are rendered in the modal
  await expect(page.locator('label:has-text("Guest Name")')).toBeVisible();
  await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
  await expect(page.locator('label:has-text("Phone Number")')).toBeVisible();
  await expect(page.locator('label:has-text("Company / Organization")')).toBeVisible();
  await expect(page.locator('label:has-text("Dietary Preference")')).toBeVisible();

  // Select the ticket type
  await page.click('text=VIP Ticket');

  // Fill in the fields
  await page.fill('input[placeholder="Enter Guest Name"]', 'John Wick');
  await page.fill('input[placeholder="Enter Email Address"]', 'john@continental.com');
  await page.fill('input[placeholder="Enter Phone Number"]', '+123456789');
  await page.fill('input[placeholder="Enter Company / Organization"]', 'The Continental');
  await page.selectOption('select:has-text("Select Dietary Preference...")', 'Vegan');

  // Take a screenshot of the filled modal for verification
  await page.screenshot({ path: 'verify_walkin_modal_dynamic_fields.png', fullPage: true });

  // Submit the registration
  await page.click('text=Complete Registration');

  // Wait for success alert/modal
  await page.waitForSelector('text=Registration Successful!', { timeout: 10000 });

  // Assert that walkInPayload was populated and contains both standard and custom fields correctly
  expect(walkInPayload).not.toBeNull();
  expect(walkInPayload.ticketId).toBe('ticket-1');
  expect(walkInPayload.attendeeData).not.toBeNull();
  expect(walkInPayload.attendeeData.fullName).toBe('John Wick');
  expect(walkInPayload.attendeeData.email).toBe('john@continental.com');
  expect(walkInPayload.attendeeData.phone).toBe('+123456789');
  expect(walkInPayload.attendeeData.company).toBe('The Continental');
  expect(walkInPayload.attendeeData.dietary).toBe('Vegan');

  console.log('Test passed successfully, payload matched expectations:', walkInPayload);
});
