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

  console.log('Navigating to live https://shop-kandalovers.devtushar.uk/shop...');
  await page.goto('https://shop-kandalovers.devtushar.uk/shop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Take full shop screenshot
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'live-card-shop.png'),
    fullPage: false
  });

  // Take focused screenshot of the first card
  const firstCard = await page.locator('article').first();
  if (firstCard) {
    await firstCard.screenshot({
      path: path.join(ARTIFACTS_DIR, 'live-card-closeup.png')
    });
    console.log('Captured live card closeup!');
  }

  // Navigate to live home page
  console.log('Navigating to live https://shop-kandalovers.devtushar.uk/...');
  await page.goto('https://shop-kandalovers.devtushar.uk', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'live-card-home.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Done capturing live screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
