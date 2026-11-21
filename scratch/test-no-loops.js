const { chromium } = require('playwright');
const crypto = require('crypto');
const path = require('path');

const SESSION_SECRET = 'dev-super-secure-session-secret-key-32-chars-long';
const artifactDir = path.resolve('C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d');

function createSessionToken(user) {
  const payload = {
    user: {
      id: user.id || 'usr-dev-master',
      name: user.name || 'Tushar (Developer)',
      email: user.email || 'tushar0p.test@gmail.com',
      role: user.role || 'DEVELOPER',
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

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Test 1: Accessing portal with error and redirect - MUST NOT RELOAD OR LOOP
  console.log('Testing portal with error parameter (verifying no loop/crash)...');
  const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1.newPage();
  
  let navigationCount = 0;
  page1.on('framenavigated', () => {
    navigationCount++;
  });

  await page1.goto('https://shop-kandalovers.devtushar.uk/portal?error=unauthorized_dev&redirect=%2Fdeveloper', {
    waitUntil: 'networkidle',
  });
  await page1.waitForTimeout(3000);

  console.log(`Navigation count on /portal: ${navigationCount} (should be 1)`);
  if (navigationCount > 2) {
    throw new Error(`Infinite reload detected! Navigation count was ${navigationCount}`);
  }

  const portalShot = path.join(artifactDir, 'verified-portal-no-loop.png');
  await page1.screenshot({ path: portalShot });
  console.log(`Saved screenshot: ${portalShot}`);

  // Test 2: Logged in as Developer on /developer - MUST REMAIN SOLID
  console.log('Testing /developer with authenticated Developer session...');
  const devToken = createSessionToken({ email: 'tushar0p.test@gmail.com', role: 'DEVELOPER' });
  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context2.addCookies([
    {
      name: 'sg_session',
      value: devToken,
      domain: 'shop-kandalovers.devtushar.uk',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);
  const page2 = await context2.newPage();

  let devNavCount = 0;
  page2.on('framenavigated', () => {
    devNavCount++;
  });

  await page2.goto('https://shop-kandalovers.devtushar.uk/developer', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(4000);

  console.log(`Navigation count on /developer: ${devNavCount} (should be 1)`);
  if (devNavCount > 2) {
    throw new Error(`Infinite reload on /developer! Navigation count was ${devNavCount}`);
  }

  const devShot = path.join(artifactDir, 'verified-developer-stable.png');
  await page2.screenshot({ path: devShot });
  console.log(`Saved screenshot: ${devShot}`);

  await browser.close();
  console.log('ALL RELOAD LOOP AND CRASH TESTS PASSED!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
