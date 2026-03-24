const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const widths = [375, 768, 1024, 1280];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: `/home/jules/verification/debug_layout_${width}.png`, fullPage: false });
  }

  await browser.close();
})();
