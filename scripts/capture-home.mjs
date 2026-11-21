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

  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Full page screenshot of clean home
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'clean-home-full.png'),
    fullPage: true
  });

  // Viewport screenshot of hero & top section
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'clean-home-hero.png'),
    fullPage: false
  });

  // Scroll down to the 6 harvests editorial spotlight
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'clean-home-spotlight.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Captured clean homepage screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
