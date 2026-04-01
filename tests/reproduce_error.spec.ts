import { test, expect } from '@playwright/test';

test('verify organizer dashboard and check for errors', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    if (msg.text().includes('ChevronRight')) {
        console.log('FOUND IT!');
    }
  });

  page.on('pageerror', error => {
    console.log(`BROWSER PAGE ERROR: ${error.message}`);
  });

  // Navigate to dashboard
  await page.goto('http://localhost:3000/organizer/dashboard');

  // Wait for some time
  await page.waitForTimeout(5000);

  const content = await page.content();
  if (content.includes('ChevronRight')) {
      console.log('ChevronRight found in page content');
  }

  await page.screenshot({ path: 'debug_error.png', fullPage: true });
});
