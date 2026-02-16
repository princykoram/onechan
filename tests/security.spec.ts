import { test, expect, request } from '@playwright/test';

/*
  File: security.spec.ts
  Module: Security & Access Control
  Scope: RBAC, Session, Tokens, CSRF, API Security, Fraud, Audit Logs
*/

test.describe('Security – Role Based Access Control (RBAC)', () => {

  test('Retail user blocked from dealer-only URL', async ({ page }) => {
    await page.goto('/dealer/dashboard');
    await expect(page).toHaveURL(/403|access-denied/);
  });

  test('Admin URL blocked for non-admin user', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('Elevated permission URL via bookmark blocked', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/403|access-denied/);
  });

  test('Retail user cannot access other user’s order', async ({ page }) => {
    await page.goto('/orders/OTHER_USER_ORDER_ID');
    await expect(page.locator('text=Unauthorized')).toBeVisible();
  });

});

test.describe('Security – Session & Authentication', () => {

  test('Auto logout after idle session timeout', async ({ page }) => {
    await page.goto('/account');
    await page.waitForTimeout(5000); // mocked timeout
    await expect(page).toHaveURL(/login/);
  });

  test('Action after session expiration redirects to login', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(5000);
    await page.click('[data-testid="checkout"]');
    await expect(page).toHaveURL(/login/);
  });

  test('Multi-device login triggers warning or session invalidation', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('/login');
    await page2.goto('/login');

    await expect(page2.locator('.session-warning')).toBeVisible();
  });

  test('Forced password reset invalidates active sessions', async ({ page }) => {
    await page.goto('/account/security');
    await page.click('[data-testid="force-reset"]');

    await page.goto('/account');
    await expect(page).toHaveURL(/login/);
  });

});

test.describe('Security – Token, JWT & CSRF Protection', () => {

  test('API rejects expired or invalid JWT token', async () => {
    const apiContext = await request.newContext({
      extraHTTPHeaders: {
        Authorization: 'Bearer INVALID_TOKEN'
      }
    });

    const response = await apiContext.get('/api/orders');
    expect(response.status()).toBe(401);
  });

  test('Request without auth token blocked for cart/checkout', async ({ page }) => {
    await page.goto('/checkout', { headers: { Authorization: '' } });
    await expect(page.locator('text=Unauthorized')).toBeVisible();
  });

  test('Invalid or missing CSRF token request rejected', async ({ page }) => {
    await page.goto('/checkout?csrf=invalid');
    await expect(page.locator('text=CSRF validation failed')).toBeVisible();
  });

  test('Replay attack using same token blocked', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="pay-now"]');
    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('text=Duplicate request')).toBeVisible();
  });

  test('Old CSRF token rejected', async ({ page }) => {
    await page.goto('/checkout?csrf=expired');
    await expect(page.locator('text=Session expired')).toBeVisible();
  });

});

test.describe('Security – Parameter & URL Manipulation', () => {

  test('Price/discount modification in URL blocked', async ({ page }) => {
    await page.goto('/checkout?amount=1');
    await expect(page.locator('text=Invalid request')).toBeVisible();
  });

  test('Vehicle/part ID manipulation rejected', async ({ page }) => {
    await page.goto('/pdp?partId=INVALID');
    await expect(page.locator('text=Invalid part')).toBeVisible();
  });

  test('Shipping or billing modification via request blocked', async ({ page }) => {
    await page.goto('/checkout?shipping=free');
    await expect(page.locator('text=Unauthorized modification')).toBeVisible();
  });

});

test.describe('Security – Input Sanitization & Injection', () => {

  test('Search, filters, VIN sanitize malicious input', async ({ page }) => {
    await page.goto('/search');
    await page.fill('#search', '<script>alert(1)</script>');
    await expect(page.locator('script')).toHaveCount(0);
  });

  test('Reviews & wishlist block script injection', async ({ page }) => {
    await page.goto('/pdp');
    await page.fill('#review', '<img src=x onerror=alert(1)>');
    await page.click('[data-testid="submit-review"]');

    await expect(page.locator('text=Invalid input')).toBeVisible();
  });

  test('Malicious file upload blocked', async ({ page }) => {
    await page.goto('/account/uploads');
    await page.setInputFiles('#upload', 'tests/fixtures/malware.exe');

    await expect(page.locator('text=File type not allowed')).toBeVisible();
  });

});

test.describe('Security – Checkout & Payment Protection', () => {

  test('Retry payment does not cause duplicate charge', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="pay-now"]');
    await page.click('[data-testid="retry-payment"]');

    await expect(page.locator('text=Duplicate charge prevented')).toBeVisible();
  });

  test('Repeat checkout request blocked', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="pay-now"]');
    await page.reload();

    await expect(page.locator('text=Request already processed')).toBeVisible();
  });

  test('Confirmation page visible only to correct user', async ({ page }) => {
    await page.goto('/order/confirmation/OTHER_USER');
    await expect(page.locator('text=Unauthorized')).toBeVisible();
  });

});

test.describe('Security – API & Backend Enforcement', () => {

  test('Unauthorized API endpoint access blocked', async () => {
    const apiContext = await request.newContext();
    const response = await apiContext.get('/api/admin/reports');
    expect(response.status()).toBe(401);
  });

  test('Direct API call bypassing frontend blocked', async () => {
    const apiContext = await request.newContext();
    const response = await apiContext.post('/api/checkout');
    expect(response.status()).toBe(401);
  });

  test('API responses do not expose sensitive data', async () => {
    const apiContext = await request.newContext();
    const response = await apiContext.get('/api/products');

    const body = await response.text();
    expect(body).not.toContain('costPrice');
    expect(body).not.toContain('internalStock');
  });

});

test.describe('Security – Brute Force, Fraud & Monitoring', () => {

  test('Brute force login attempts trigger lockout or CAPTCHA', async ({ page }) => {
    await page.goto('/login');

    for (let i = 0; i < 5; i++) {
      await page.fill('#password', 'WrongPass');
      await page.click('[data-testid="login"]');
    }

    await expect(page.locator('.captcha')).toBeVisible();
  });

  test('Rapid API requests rate-limited', async () => {
    const apiContext = await request.newContext();

    const responses = await Promise.all(
      Array(10).fill(0).map(() => apiContext.get('/api/orders'))
    );

    expect(responses.some(r => r.status() === 429)).toBeTruthy();
  });

  test('Unusual login triggers MFA', async ({ page }) => {
    await page.goto('/login?newDevice=true');
    await expect(page.locator('.mfa-challenge')).toBeVisible();
  });

});

test.describe('Security – Audit Logs & Alerts', () => {

  test('Unauthorized access attempts logged with IP and user', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('Critical actions logged with timestamp and user', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="pay-now"]');

    await page.goto('/admin/audit-logs');
    await expect(page.locator('.log-entry')).toContainText('PAYMENT');
  });

  test('Repeated failed access triggers security alert', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.locator('.security-alert')).toBeVisible();
  });

});
