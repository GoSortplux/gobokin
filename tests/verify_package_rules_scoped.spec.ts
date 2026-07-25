import { test, expect } from '@playwright/test';

test.describe('Super Admin Package Rules Scoped Configuration', () => {
  test('Verify GET /api/v1/events/admin/config query parameters', async ({ request }) => {
    // 1. Fetch unscoped config
    const responseAll = await request.get('http://localhost:3000/api/v1/events/admin/config');
    expect(responseAll.ok()).toBeTruthy();
    const dataAll = await responseAll.json();
    expect(dataAll.success).toBe(true);
    const keysAll = dataAll.data.map((item: { key: string }) => item.key);
    expect(keysAll).toContain('COMMISSION_RATE');
    expect(keysAll).toContain('MAX_ACTIVE_EVENTS');

    // 2. Fetch packageRules scoped config
    const responseScoped = await request.get('http://localhost:3000/api/v1/events/admin/config?scope=packageRules');
    expect(responseScoped.ok()).toBeTruthy();
    const dataScoped = await responseScoped.json();
    expect(dataScoped.success).toBe(true);
    const keysScoped = dataScoped.data.map((item: { key: string }) => item.key);
    expect(keysScoped).not.toContain('COMMISSION_RATE');
    expect(keysScoped).toContain('MAX_ACTIVE_EVENTS');
    expect(keysScoped).toContain('MAX_GUESTS');
    expect(keysScoped).toContain('BULK_IMPORT_ALLOWED');
  });

  test('Verify package creation rule dropdown list in Super Admin Dashboard', async ({ page }) => {
    // Generate valid base64-encoded JWT payload for super-admin
    const payload = {
      _id: '69918da336d3e0fd3f1fa6af',
      email: 'admin@gobokin.com',
      role: ['super-admin'],
      activeRole: 'super-admin',
      hasAcceptedLatestPolicies: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

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

    await page.addInitScript(({ token, userStr }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('user', userStr);
      window.localStorage.setItem('lastActivity', Date.now().toString());
      document.cookie = `token=${token}; path=/;`;
    }, { token: mockToken, userStr: userJson });

    // Mock API requests to bypass real backends/production calls
    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: '69918da336d3e0fd3f1fa6af',
            fullName: 'Super Admin',
            role: ['super-admin'],
            activeRole: 'super-admin'
          }
        })
      });
    });

    // Mock the events config endpoint to avoid any cross-origin/remote 401 issues
    await page.route('**/events/admin/config*', async (route) => {
      const url = new URL(route.request().url());
      const scope = url.searchParams.get('scope');

      let config = [
        { key: 'MAX_ACTIVE_EVENTS', value: '5', description: 'Maximum active events allowed per organizer by default.' },
        { key: 'MAX_GUESTS', value: '1000', description: 'Maximum guests allowed per event by default.' },
        { key: 'COMMISSION_RATE', value: '5', description: 'Default platform commission rate percentage on ticket sales.' },
        { key: 'BULK_IMPORT_ALLOWED', value: 'false', description: 'Whether bulk import of attendees is enabled by default.' }
      ];

      if (scope === 'packageRules') {
        config = config.filter(item => ['MAX_ACTIVE_EVENTS', 'MAX_GUESTS', 'BULK_IMPORT_ALLOWED'].includes(item.key));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: config
        })
      });
    });

    // Mock the events packages endpoint to keep it stable
    await page.route('**/events/admin/packages*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'pkg-basic-123',
              name: 'Basic Event Package',
              price: 15000,
              isActive: true,
              isPublic: true,
              durationDays: 30,
              type: 'SUBSCRIPTION',
              discountPercentage: 0,
              rules: [
                { ruleKey: 'MAX_GUESTS', ruleValue: '500' }
              ]
            }
          ]
        })
      });
    });

    // Go to Settings page
    await page.goto('http://localhost:3000/admin/events/settings');

    // Wait for the settings page to render initial items
    await page.waitForSelector('h1:has-text("System Settings")');

    // Click Subscription Packages tab
    await page.click('button:has-text("Subscription Packages")');

    // Wait for the packages section to load and find the "Create Package" button
    const createBtn = page.locator('button:has-text("Create Package")');
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Locate the select dropdown for package rule key
    const selectOptions = page.locator('select');
    await expect(selectOptions).toBeVisible();

    // Verify option keys (it should contain MAX_GUESTS and NOT contain COMMISSION_RATE)
    const selectContent = await selectOptions.innerHTML();
    expect(selectContent).toContain('MAX_ACTIVE_EVENTS');
    expect(selectContent).toContain('MAX_GUESTS');
    expect(selectContent).not.toContain('COMMISSION_RATE');

    // Take screenshot for visual verification
    await page.screenshot({ path: 'verify_package_rules_scoped.png', fullPage: true });
  });
});
