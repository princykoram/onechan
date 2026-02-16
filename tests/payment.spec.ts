import { test, expect } from '@playwright/test';

/*
  File: payment.spec.ts
  Module: Checkout – Payment
  Covers: Card, UPI, NetBanking, Wallet, Retry, Failure, Duplication, Gateway issues
*/

test.describe('Payment – Successful Scenarios', () => {

  test('Credit card payment approved successfully', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-credit-card"]');
    await page.fill('#cardNumber', '4111111111111111');
    await page.fill('#expiry', '12/30');
    await page.fill('#cvv', '123');

    await page.click('[data-testid="pay-now"]');

    await expect(page).toHaveURL(/order-confirmation/);
    await expect(page.locator('.order-success')).toBeVisible();
  });

  test('Debit card payment with OTP approved', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-debit-card"]');
    await page.fill('#cardNumber', '5555555555554444');
    await page.fill('#expiry', '11/30');
    await page.fill('#cvv', '456');

    await page.click('[data-testid="pay-now"]');
    await page.fill('#otp', '123456');
    await page.click('[data-testid="submit-otp"]');

    await expect(page.locator('.order-success')).toBeVisible();
  });

  test('UPI payment approved successfully', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-upi"]');
    await page.click('[data-testid="upi-qr"]');

    await expect(page.locator('.payment-pending')).toBeVisible();
    await page.waitForSelector('.payment-success');

    await expect(page).toHaveURL(/order-confirmation/);
  });

  test('Net banking payment approved successfully', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-netbanking"]');
    await page.selectOption('#bank', 'HDFC');
    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.order-success')).toBeVisible();
  });

  test('Wallet / EMI payment approved successfully', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-wallet"]');
    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.order-success')).toBeVisible();
  });

  test('Split payment wallet + card approved', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-split"]');
    await page.fill('#walletAmount', '500');
    await page.fill('#cardNumber', '4111111111111111');
    await page.fill('#expiry', '12/30');
    await page.fill('#cvv', '123');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.order-success')).toBeVisible();
  });

});

test.describe('Payment – Failure Scenarios', () => {

  test('Payment declined due to insufficient funds', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-credit-card"]');
    await page.fill('#cardNumber', '4000000000009995');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-error'))
      .toContainText('Insufficient funds');
  });

  test('Invalid card payment declined', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-credit-card"]');
    await page.fill('#cardNumber', '1234567890123456');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-error'))
      .toContainText('Invalid card');
  });

  test('Expired card payment declined', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="payment-credit-card"]');
    await page.fill('#cardNumber', '4111111111111111');
    await page.fill('#expiry', '01/20');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-error'))
      .toContainText('Card expired');
  });

  test('Gateway downtime error displayed', async ({ page }) => {
    await page.goto('/checkout/payment?mock=gatewayDown');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-error'))
      .toContainText('Payment gateway unavailable');
  });

  test('Network disconnect during payment', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.context().setOffline(true);
    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-error'))
      .toContainText('Network error');

    await page.context().setOffline(false);
  });

});

test.describe('Payment – Retry & Recovery', () => {

  test('Automatic retry succeeds after gateway recovers', async ({ page }) => {
    await page.goto('/checkout/payment?mock=timeoutThenSuccess');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-success')).toBeVisible();
  });

  test('User clicks Retry and payment succeeds', async ({ page }) => {
    await page.goto('/checkout/payment?mock=failOnce');

    await page.click('[data-testid="pay-now"]');
    await page.click('[data-testid="retry-payment"]');

    await expect(page.locator('.order-success')).toBeVisible();
  });

  test('Retry limit reached shows clear error', async ({ page }) => {
    await page.goto('/checkout/payment?mock=alwaysFail');

    await page.click('[data-testid="pay-now"]');
    await page.click('[data-testid="retry-payment"]');
    await page.click('[data-testid="retry-payment"]');

    await expect(page.locator('.payment-error'))
      .toContainText('Retry limit exceeded');
  });

});

test.describe('Payment – Duplication & Security', () => {

  test('Refresh page after Pay does not duplicate payment', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="pay-now"]');
    await page.reload();

    await expect(page.locator('.order-confirmation')).toHaveCount(1);
  });

  test('Back button during payment does not duplicate order', async ({ page }) => {
    await page.goto('/checkout/payment');

    await page.click('[data-testid="pay-now"]');
    await page.goBack();
    await page.goForward();

    await expect(page.locator('.order-confirmation')).toHaveCount(1);
  });

  test('Multiple tabs payment only succeeds once', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('/checkout/payment');
    await page2.goto('/checkout/payment');

    await page1.click('[data-testid="pay-now"]');
    await page2.click('[data-testid="pay-now"]');

    await expect(page1.locator('.order-success')).toBeVisible();
    await expect(page2.locator('.payment-error'))
      .toContainText('Payment already processed');
  });

});

test.describe('Payment – Post Payment Validation', () => {

  test('Order confirmation email and SMS sent', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.email-sent')).toBeVisible();
    await expect(page.locator('.sms-sent')).toBeVisible();
  });

  test('Inventory decremented after successful payment', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.inventory-updated')).toBeVisible();
  });

  test('Multi-item cart payment either full success or rollback', async ({ page }) => {
    await page.goto('/checkout/payment?mock=partialFail');

    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('.payment-error')).toContainText('Payment failed');
    await expect(page.locator('.order-confirmation')).toHaveCount(0);
  });

});
