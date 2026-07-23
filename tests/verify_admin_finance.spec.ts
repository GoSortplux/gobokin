import { test, expect } from '@playwright/test';

test('Verify Super Admin Finance Dashboard with real populated data', async ({ page }) => {
  // Generate a valid base64-encoded JWT payload to satisfy jwt-decode in AuthContext
  const payload = {
    _id: '69918da336d3e0fd3f1fa6af',
    email: 'admin@gobokin.com',
    role: ['super-admin'],
    activeRole: 'super-admin',
    hasAcceptedLatestPolicies: true,
    hasAcceptedHallOwnerPolicy: true,
    hasAcceptedOrganizerPolicy: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days in future
  };

  // Construct a mock JWT token (header.payload.signature)
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '');
  const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature`;

  const userJson = JSON.stringify({
    _id: '69918da336d3e0fd3f1fa6af',
    fullName: 'Super Admin',
    email: 'admin@gobokin.com',
    role: ['super-admin'],
    activeRole: 'super-admin',
    hasAcceptedLatestPolicies: true
  });

  // Mock authentication token and super-admin profile to bypass Auth guard
  await page.addInitScript(({ token, userStr }) => {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('user', userStr);
    window.localStorage.setItem('lastActivity', Date.now().toString());

    // Set cookies as well for cross-subdomain compatibility
    document.cookie = `token=${token}; path=/;`;
    document.cookie = `user=${encodeURIComponent(userStr)}; path=/;`;
  }, { token: mockToken, userStr: userJson });

  // Intercept the API call to /events/admin/finance/summary and return our mocked data
  await page.route('**/api/v1/events/admin/finance/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totals: {
            amount: "250",
            commission: "10",
            netAmount: "240"
          },
          totalWithdrawals: "240",
          organizerCount: 4,
          topOrganizers: [
            {
              id: "02209968-60f0-49b6-a175-f3bf852ab4d2",
              organizerId: "bf19292b-8361-44a4-9cbd-31dbf8dd34ce",
              pendingBalance: "0",
              availableBalance: "0",
              withdrawnBalance: "0",
              currency: "NGN",
              updatedAt: "2026-07-20T12:47:30.711Z",
              organizer: {
                id: "bf19292b-8361-44a4-9cbd-31dbf8dd34ce",
                mongoUserId: "6991944436d3e0fd3f1fa7fb",
                slug: "stephen-ayomide-ibitoye",
                status: "NEW",
                isVerified: false,
                bio: null,
                website: null,
                socialLinks: null,
                commissionRate: "4",
                payoutPolicy: "POST_EVENT",
                settlementDelayOverride: null,
                autoPromotionEligible: true,
                maxStaff: 5,
                defaultRefundType: "NONE",
                defaultRefundPercentage: "0",
                defaultRefundCutoffDays: 0,
                defaultRefundPolicy: null,
                createdAt: "2026-07-20T12:47:30.711Z",
                updatedAt: "2026-07-20T12:47:30.711Z"
              }
            },
            {
              id: "ecd92e46-95e5-44fe-b181-bc6c1b44ddfd",
              organizerId: "bb094a3e-b6c0-4241-b7b4-ae5caf5b7244",
              pendingBalance: "0",
              availableBalance: "0",
              withdrawnBalance: "0",
              currency: "NGN",
              updatedAt: "2026-07-20T15:37:09.640Z",
              organizer: {
                id: "bb094a3e-b6c0-4241-b7b4-ae5caf5b7244",
                mongoUserId: "69918da336d3e0fd3f1fa6af",
                slug: "super-admin",
                status: "NEW",
                isVerified: false,
                bio: null,
                website: null,
                socialLinks: null,
                commissionRate: "4",
                payoutPolicy: "POST_EVENT",
                settlementDelayOverride: null,
                autoPromotionEligible: true,
                maxStaff: 5,
                defaultRefundType: "NONE",
                defaultRefundPercentage: "0",
                defaultRefundCutoffDays: 0,
                defaultRefundPolicy: null,
                createdAt: "2026-07-20T15:37:09.640Z",
                updatedAt: "2026-07-20T15:37:09.640Z"
              }
            },
            {
              id: "0377e1db-4045-478a-87e4-b1de29222e97",
              organizerId: "4f5d715b-83c9-4419-be5a-2ad3804850c9",
              pendingBalance: "0",
              availableBalance: "0",
              withdrawnBalance: "0",
              currency: "NGN",
              updatedAt: "2026-07-22T11:39:32.685Z",
              organizer: {
                id: "4f5d715b-83c9-4419-be5a-2ad3804850c9",
                mongoUserId: "699314bb5046c65757cd651b",
                slug: "rightsort-ace",
                status: "NEW",
                isVerified: false,
                bio: null,
                website: null,
                socialLinks: null,
                commissionRate: "4",
                payoutPolicy: "POST_EVENT",
                settlementDelayOverride: null,
                autoPromotionEligible: true,
                maxStaff: 5,
                defaultRefundType: "NONE",
                defaultRefundPercentage: "0",
                defaultRefundCutoffDays: 0,
                defaultRefundPolicy: null,
                createdAt: "2026-07-22T11:39:32.685Z",
                updatedAt: "2026-07-22T11:39:32.685Z"
              }
            },
            {
              id: "cb65bce6-a18d-4125-8284-11690a6b4d19",
              organizerId: "1013ef19-8819-49b6-86b1-8aa83dabd543",
              pendingBalance: "0",
              availableBalance: "0",
              withdrawnBalance: "0",
              currency: "NGN",
              updatedAt: "2026-07-23T14:42:32.763Z",
              organizer: {
                id: "1013ef19-8819-49b6-86b1-8aa83dabd543",
                mongoUserId: "699232365046c65757cd52be",
                slug: "doncodeo",
                status: "ESTABLISHED",
                isVerified: false,
                bio: null,
                website: null,
                socialLinks: null,
                commissionRate: "3",
                payoutPolicy: "T_PLUS_2",
                settlementDelayOverride: null,
                autoPromotionEligible: true,
                maxStaff: 20,
                defaultRefundType: "NONE",
                defaultRefundPercentage: "0",
                defaultRefundCutoffDays: 0,
                defaultRefundPolicy: null,
                createdAt: "2026-07-20T14:26:25.364Z",
                updatedAt: "2026-07-22T11:55:05.596Z"
              }
            }
          ]
        }
      })
    });
  });

  // Intercept users/me background refresh API call
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          _id: '69918da336d3e0fd3f1fa6af',
          fullName: 'Super Admin',
          email: 'admin@gobokin.com',
          role: ['super-admin'],
          activeRole: 'super-admin'
        }
      })
    });
  });

  // Navigate to super admin finance dashboard
  await page.goto('http://localhost:3000/admin/events/finance');

  // Verify elements are visible using a non-strict or targetted heading locator
  const financeDashboardHeading = page.locator('h1').last();
  await expect(financeDashboardHeading).toContainText('Finance');

  // Verify total gross volume card
  const grossCard = page.locator('p:has-text("TOTAL GROSS VOLUME") + h3');
  await expect(grossCard).toContainText('₦250');

  // Verify platform revenue card
  const revenueCard = page.locator('p:has-text("PLATFORM REVENUE") + h3');
  await expect(revenueCard).toContainText('₦10');

  // Verify Net Amount / Earnings card
  const netCard = page.locator('p:has-text("NET AMOUNT / EARNINGS") + h3');
  await expect(netCard).toContainText('₦240');

  // Verify Total Withdrawals card
  const withdrawalsCard = page.locator('p:has-text("TOTAL WITHDRAWALS") + h3');
  await expect(withdrawalsCard).toContainText('₦240');

  // Verify Total Organizers count card
  const organizersCountCard = page.locator('p:has-text("TOTAL ORGANIZERS") + h3');
  await expect(organizersCountCard).toContainText('4');

  // Verify the Top Organizers section is present
  await expect(page.locator('h3:has-text("Top Organizers & Wallets")')).toBeVisible();

  // Verify Stephen Ayomide Ibitoye is loaded in the table
  await expect(page.locator('table')).toContainText('Stephen Ayomide Ibitoye');
  // Verify Doncodeo is loaded in the table
  await expect(page.locator('table')).toContainText('Doncodeo');

  // Take a screenshot to verify the beautiful layout
  await page.screenshot({ path: 'verify_admin_finance_dashboard.png', fullPage: true });
});
