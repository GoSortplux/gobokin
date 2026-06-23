import { test, expect } from '@playwright/test';

test('Verify search bars on Orders and Staff pages', async ({ page }) => {
  // Mock session
  await page.addInitScript(() => {
    const mockUser = {
      _id: 'user123',
      email: 'organizer@example.com',
      role: ['organizer'],
      activeRole: 'organizer',
      hasAcceptedLatestPolicies: true,
      hasAcceptedHallOwnerPolicy: true
    };
    const token = 'header.' + btoa(JSON.stringify(mockUser)) + '.signature';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  // Mock API for Orders
  await page.route('**/api/v1/events/orders', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'ord1', ticketNumber: 'TKT-001', buyerInfo: { fullName: 'John Doe' }, event: { title: 'Event A' }, amountPaid: 1000, status: 'PAID' },
          { id: 'ord2', ticketNumber: 'TKT-002', buyerInfo: { fullName: 'Jane Smith' }, event: { title: 'Event B' }, amountPaid: 2000, status: 'PAID' }
        ]
      })
    });
  });

  // Mock API for Staff
  await page.route('**/api/v1/events/my-organizer-profile/staff', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'staff1', fullName: 'Alice Johnson', email: 'alice@example.com', role: 'STAFF', canRegisterGuests: true },
          { id: 'staff2', fullName: 'Bob Wilson', email: 'bob@example.com', role: 'MANAGER', canRegisterGuests: false }
        ]
      })
    });
  });

  await page.route('**/api/v1/events/my-events', async route => {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
    })
  })

  // Test Orders Search
  await page.goto('http://localhost:3000/organizer/dashboard/orders');
  await expect(page.getByText('John Doe')).toBeVisible();
  await expect(page.getByText('Jane Smith')).toBeVisible();

  await page.getByPlaceholder('Search orders by ID or attendee name...').fill('John');
  await expect(page.getByText('John Doe')).toBeVisible();
  await expect(page.getByText('Jane Smith')).not.toBeVisible();

  // Test Staff Search
  await page.goto('http://localhost:3000/organizer/dashboard/staff');
  await expect(page.getByText('Alice Johnson')).toBeVisible();
  await expect(page.getByText('Bob Wilson')).toBeVisible();

  await page.getByPlaceholder('Search staff by name or email...').fill('Alice');
  await expect(page.getByText('Alice Johnson')).toBeVisible();
  await expect(page.getByText('Bob Wilson')).not.toBeVisible();
});
