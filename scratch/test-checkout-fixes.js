const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\umarf\\.gemini\\antigravity\\brain\\0ce416d0-4e63-4670-96c1-b390f37b210d';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

  await page.goto('https://shop-kandalovers.devtushar.uk', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
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

  await page.goto('https://shop-kandalovers.devtushar.uk/checkout', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Capture desktop order summary before PIN entry
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified-checkout-before-pin.png')
  });
  console.log('Saved: verified-checkout-before-pin.png');

  // Fill PIN code 413304 (Pandharpur, Maharashtra)
  const pinInput = await page.$('input[placeholder="6-digit PIN code"]');
  if (pinInput) {
    await pinInput.fill('413304');
    await page.waitForTimeout(2500); // Wait for live Delhivery rate
  }

  const payBtn = await page.$('button:has-text("Razorpay")');
  if (payBtn) {
    console.log('Pay button with PIN 413304:', await payBtn.innerText());
  }

  // Capture desktop order summary after PIN entry
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified-checkout-after-pin.png')
  });
  console.log('Saved: verified-checkout-after-pin.png');

  await browser.close();
  console.log('ALL TESTS COMPLETED!');
}

run().catch(console.error);
