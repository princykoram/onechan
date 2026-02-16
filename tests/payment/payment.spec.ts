import { test, expect } from '@playwright/test';

test.describe('Payment Flow - Ecommerce Auto Parts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://nexustruckupgrades.onechanneladmin.com/');
  });

  test('Pay using credit/debit card', async ({ page }) => {
    // Add product
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    // Select Card Payment
    await page.locator('input[value="card"]').click();

    // Enter card details (sandbox)
    await page.fill('input[name="cardNumber"]', '4111111111111111');
    await page.fill('input[name="expiry"]', '12/30');
    await page.fill('input[name="cvv"]', '123');

    await page.locator('button:has-text("Pay Now")').click();

    // Validate success
    await expect(page.locator('text=Order Confirmed')).toBeVisible();
  });

  test('Pay using UPI / Net Banking', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    // Select UPI / NetBanking
    await page.locator('input[value="upi"]').click();
    await page.locator('button:has-text("Pay Now")').click();

    await expect(page.locator('text=Order Confirmed')).toBeVisible();
  });

  test('Payment success flow', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.locator('input[value="card"]').click();
    await page.fill('input[name="cardNumber"]', '4111111111111111');
    await page.fill('input[name="expiry"]', '12/30');
    await page.fill('input[name="cvv"]', '123');

    await page.locator('button:has-text("Pay Now")').click();

    await expect(page).toHaveURL(/order-confirmation/);
  });

  test('Payment failure handling', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    // Invalid card details
    await page.locator('input[value="card"]').click();
    await page.fill('input[name="cardNumber"]', '4000000000000002');
    await page.fill('input[name="expiry"]', '12/20');
    await page.fill('input[name="cvv"]', '000');

    await page.locator('button:has-text("Pay Now")').click();

    await expect(page.locator('text=Payment Failed')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('Prevent duplicate payment on refresh', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.locator('input[value="card"]').click();
    await page.fill('input[name="cardNumber"]', '4111111111111111');
    await page.fill('input[name="expiry"]', '12/30');
    await page.fill('input[name="cvv"]', '123');

    await page.locator('button:has-text("Pay Now")').click();
    await page.reload();

    // Validate no duplicate charge
    await expect(page.locator('text=Order Confirmed')).toBeVisible();
    await expect(page.locator('text=Payment already processed')).toBeVisible();
  });

  test('EMI / Financing eligibility', async ({ page }) => {
    // Add EMI eligible product
    await page.locator('text=EMI Eligible').first().click();
    await page.locator('button:has-text("Add to Cart")').click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await expect(page.locator('text=EMI Options')).toBeVisible();
  });

});
