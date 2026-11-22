const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\umarf\\.gemini\\antigravity\\brain\\0ce416d0-4e63-4670-96c1-b390f37b210d';

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // Mobile test
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  await mobilePage.goto('https://shop-kandalovers.devtushar.uk', { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(() => {
    localStorage.setItem('sg_cart', JSON.stringify([
      {
        productId: 'raw-honey-comb-1kg',
        productName: 'Raw Honey Comb (1kg)',
        price: 89900,
        quantity: 1,
        weight: '1000g'
      }
    ]));
  });

  await mobilePage.goto('https://shop-kandalovers.devtushar.uk/checkout', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const reviewBtn = await mobilePage.$('button:has-text("Order Summary")');
  if (reviewBtn) {
    await reviewBtn.click();
    await mobilePage.waitForTimeout(500);
  }

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified-checkout-mobile-final.png')
  });
  console.log('Saved: verified-checkout-mobile-final.png');

  await browser.close();
}

run().catch(console.error);
