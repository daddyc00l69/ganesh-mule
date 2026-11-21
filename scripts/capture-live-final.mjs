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

  // Live Hero
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'live-final-clean-hero.png'),
    fullPage: false
  });

  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 950));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'live-final-clean-scroll.png'),
    fullPage: false
  });

  // Navigate to live shop
  console.log('Navigating to live https://shop-kandalovers.devtushar.uk/shop...');
  await page.goto('https://shop-kandalovers.devtushar.uk/shop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const firstCard = await page.locator('article').first();
  if (firstCard) {
    await firstCard.screenshot({
      path: path.join(ARTIFACTS_DIR, 'live-final-shop-card.png')
    });
    console.log('Captured live shop card!');
  }

  await browser.close();
  console.log('Finished capturing live production verification screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
