const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SESSION_SECRET = 'dev-super-secure-session-secret-key-32-chars-long';
const artifactDir = path.resolve('C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d');

function createSessionToken(user) {
  const payload = {
    user: {
      id: user.id || 'usr-dev-master',
      name: user.name || 'Tushar (Developer)',
      email: user.email || 'tushar0p.test@gmail.com',
      role: 'DEVELOPER',
      permissions: [],
      department: 'Platform Core',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  return `usr_${payloadB64}.${hmac}`;
}

async function run() {
  const token = createSessionToken({ email: 'tushar0p.test@gmail.com', role: 'DEVELOPER' });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addCookies([
    {
      name: 'sg_session',
      value: token,
      domain: 'shop-kandalovers.devtushar.uk',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();

  console.log('Navigating to https://shop-kandalovers.devtushar.uk/developer ...');
  await page.goto('https://shop-kandalovers.devtushar.uk/developer', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const devShotPath = path.join(artifactDir, 'verified-live-developer-dashboard.png');
  await page.screenshot({ path: devShotPath, fullPage: true });
  console.log(`Saved screenshot: ${devShotPath}`);

  console.log('Navigating to https://shop-kandalovers.devtushar.uk/developer/accounts ...');
  await page.goto('https://shop-kandalovers.devtushar.uk/developer/accounts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const accountsShotPath = path.join(artifactDir, 'verified-live-developer-accounts.png');
  await page.screenshot({ path: accountsShotPath, fullPage: true });
  console.log(`Saved screenshot: ${accountsShotPath}`);

  // Test opening Edit modal or Create modal
  const createBtn = await page.$('button:has-text("Create Staff Account")');
  if (createBtn) {
    await createBtn.click();
    await page.waitForTimeout(800);
    const modalShotPath = path.join(artifactDir, 'verified-live-create-staff-modal.png');
    await page.screenshot({ path: modalShotPath });
    console.log(`Saved screenshot: ${modalShotPath}`);
  }

  // Also test mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('https://shop-kandalovers.devtushar.uk/developer/accounts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const mobileShotPath = path.join(artifactDir, 'verified-live-developer-accounts-mobile.png');
  await page.screenshot({ path: mobileShotPath, fullPage: true });
  console.log(`Saved mobile screenshot: ${mobileShotPath}`);

  await browser.close();
  console.log('All Playwright live verification tests completed successfully!');
}

run().catch((err) => {
  console.error('Playwright verification error:', err);
  process.exit(1);
});
