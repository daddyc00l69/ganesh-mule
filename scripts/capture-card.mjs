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

  console.log('Navigating to http://localhost:3000/shop...');
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take full shop screenshot
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'fixed-card-shop.png'),
    fullPage: false
  });

  // Take focused screenshot of the first card
  const firstCard = await page.locator('article').first();
  if (firstCard) {
    await firstCard.screenshot({
      path: path.join(ARTIFACTS_DIR, 'fixed-card-closeup.png')
    });
    console.log('Captured first card closeup!');
  }

  // Navigate to home page
  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take home page screenshot
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'fixed-card-home.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Done capturing screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
