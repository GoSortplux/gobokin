import { test, expect } from '@playwright/test';

test('Event Header search updates URL and marketplace', async ({ page }) => {
  // Mock auth to skip login
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock-token');
    window.localStorage.setItem('user', JSON.stringify({
      _id: '60d5ecb8b391640015f32e56',
      fullName: 'Test User',
      email: 'test@example.com',
      role: ['user'],
      activeRole: 'user',
      hasAcceptedLatestPolicies: true
    }));
  });

  await page.goto('http://localhost:3000/events');

  // Wait for the immersive hero to be visible
  await expect(page.locator('h1')).toContainText('Discover');

  // Find the search input in the EventHeader (it should be visible on desktop)
  const searchInput = page.locator('header input[placeholder="Search events..."]');
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill('Tech Conference');

  // Instead of Enter, click the search button next to it
  const searchButton = page.locator('header form button[type="submit"]');
  await searchButton.click();

  // Verify URL has search param
  await expect(page).toHaveURL(/search=Tech\+Conference/, { timeout: 10000 });

  // Check if search results title appears
  await expect(page.locator('h2')).toContainText('Search Results', { timeout: 10000 });

  await page.screenshot({ path: 'marketplace_search_results.png' });
});

test('Event Platform isolation - Header and Footer', async ({ page }) => {
  await page.goto('http://localhost:3000/events');

  // EventHeader should be present
  await expect(page.locator('header')).toContainText('Events');

  // Main site Footer should NOT be present (LayoutWrapper logic)
  const footer = page.locator('footer');
  await expect(footer).not.toBeVisible();

  await page.screenshot({ path: 'marketplace_header_only.png' });
});
