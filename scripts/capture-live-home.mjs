import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to live https://shop-kandalovers.devtushar.uk...');
  await page.goto('https://shop-kandalovers.devtushar.uk', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Take hero screenshot
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'live-clean-home-hero.png'),
    fullPage: false
  });

  // Scroll down to spotlights
  await page.evaluate(() => window.scrollBy(0, 950));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'live-clean-home-spotlight.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Done capturing live clean home screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
