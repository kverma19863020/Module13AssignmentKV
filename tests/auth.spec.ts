import { test, expect } from '@playwright/test';

const BASE      = process.env.BASE_URL || 'http://localhost:8000';
const timestamp = Date.now();
const VALID_USER  = `user_${timestamp}`;
const VALID_EMAIL = `testuser_${timestamp}@example.com`;
const VALID_PASS  = 'SecurePass123';

// ── POSITIVE 1: Register with valid data ─────────────────────────────────
test('POSITIVE: Register with valid data shows success message', async ({ page }) => {
  await page.goto(`${BASE}/register`);

  await page.fill('#username', VALID_USER);
  await page.fill('#email',    VALID_EMAIL);
  await page.fill('#password', VALID_PASS);

  await page.click('button[type="submit"]');

  const msg = page.locator('#registerMessage.success');
  await expect(msg).toBeVisible({ timeout: 10000 });
  await expect(msg).toContainText('Registration successful');
});

// ── POSITIVE 2: Login with correct credentials stores JWT ─────────────────
test('POSITIVE: Login with correct credentials stores JWT token', async ({ page }) => {
  const loginUser  = `loginuser_${timestamp}`;
  const loginEmail = `logintest_${timestamp}@example.com`;

  const regResp = await page.request.post(`${BASE}/auth/register`, {
    data: { username: loginUser, email: loginEmail, password: VALID_PASS }
  });
  expect(regResp.status()).toBe(201);

  await page.goto(`${BASE}/login`);
  await page.fill('#username', loginUser);
  await page.fill('#password', VALID_PASS);
  await page.click('button[type="submit"]');

  await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });

  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  expect(token).not.toBeNull();
  expect(token!.length).toBeGreaterThan(20);
});

// ── NEGATIVE 1: Register with short password shows client-side error ──────
test('NEGATIVE: Register with short password shows client-side error', async ({ page }) => {
  await page.goto(`${BASE}/register`);

  await page.fill('#username', `shortuser_${timestamp}`);
  await page.fill('#email',    `short_${timestamp}@example.com`);
  await page.fill('#password', '123');

  await page.click('button[type="submit"]');

  const msg = page.locator('#registerMessage.error');
  await expect(msg).toBeVisible({ timeout: 5000 });
  await expect(msg).toContainText('at least 8 characters');
});

// ── NEGATIVE 2: Login with wrong password shows 401 error ─────────────────
test('NEGATIVE: Login with wrong password shows invalid credentials', async ({ page }) => {
  const wrongUser  = `wronguser_${timestamp}`;
  const wrongEmail = `wrongpass_${timestamp}@example.com`;

  await page.request.post(`${BASE}/auth/register`, {
    data: { username: wrongUser, email: wrongEmail, password: VALID_PASS }
  });

  await page.goto(`${BASE}/login`);
  await page.fill('#username', wrongUser);
  await page.fill('#password', 'TotallyWrongPassword999');
  await page.click('button[type="submit"]');

  const msg = page.locator('#loginMessage.error');
  await expect(msg).toBeVisible({ timeout: 10000 });
  await expect(msg).toContainText('Invalid username or password');
});

// ── NEGATIVE 3: Register with invalid email shows client-side error ───────
test('NEGATIVE: Register with invalid email shows client-side error', async ({ page }) => {
  await page.goto(`${BASE}/register`);

  await page.fill('#username', `emailtest_${timestamp}`);
  await page.fill('#email',    'not-an-email');
  await page.fill('#password', 'ValidPass123');

  await page.click('button[type="submit"]');

  const msg = page.locator('#registerMessage.error');
  await expect(msg).toBeVisible({ timeout: 5000 });
  await expect(msg).toContainText('valid email');
});

// ── NEGATIVE 4: Register with short username shows client-side error ──────
test('NEGATIVE: Register with short username shows client-side error', async ({ page }) => {
  await page.goto(`${BASE}/register`);

  await page.fill('#username', 'ab');
  await page.fill('#email',    `shortname_${timestamp}@example.com`);
  await page.fill('#password', 'ValidPass123');

  await page.click('button[type="submit"]');

  const msg = page.locator('#registerMessage.error');
  await expect(msg).toBeVisible({ timeout: 5000 });
  await expect(msg).toContainText('at least 3 characters');
});
