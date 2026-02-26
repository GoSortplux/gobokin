import { test } from '@playwright/test';

test('capture marketing screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 2500 });
  await page.goto('http://localhost:3000/marketing-showcase');

  // Hide Cookie Consent if it appears
  await page.addStyleTag({ content: '.fixed.bottom-6.right-6 { display: none !important; }' });

  // Wait for content
  await page.waitForSelector('text=Financial Overview');

  // 1. Analytics & Financial Overview
  const analyticsSection = page.locator('div.bg-gray-50').first();
  await analyticsSection.screenshot({ path: 'verification/analytics_overview.png' });

  // 2. Venue Performance
  const performanceSection = page.locator('text=Venue Performance Details').locator('..');
  await performanceSection.screenshot({ path: 'verification/venue_performance.png' });

  // 3. Venue Control
  const venueControlSection = page.locator('text=Venue Control').locator('..').locator('..');
  await venueControlSection.screenshot({ path: 'verification/venue_control.png' });

  // 4. Live Activity
  const liveActivitySection = page.locator('text=Control Your Bookings').locator('..').locator('..');
  await liveActivitySection.screenshot({ path: 'verification/live_activity.png' });
});
