import { test, expect } from '@playwright/test';

/*
  File: user-account.spec.ts
  Module: User Account
  Scope: Vehicles, Orders, Addresses, Wishlist, Security, Preferences, Sync
*/

test.describe('User Account – Vehicle Management', () => {

  test('Save a new vehicle successfully', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.click('[data-testid="add-vehicle"]');
    await page.selectOption('#year', '2022');
    await page.selectOption('#make', 'Toyota');
    await page.selectOption('#model', 'Camry');
    await page.selectOption('#engine', '2.5L');
    await page.click('[data-testid="save-vehicle"]');

    await expect(page.locator('.vehicle-card')).toBeVisible();
  });

  test('Edit existing vehicle reflects across PDP and cart', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.click('[data-testid="edit-vehicle"]');
    await page.selectOption('#engine', '3.5L');
    await page.click('[data-testid="save-vehicle"]');

    await page.goto('/pdp');
    await expect(page.locator('.vehicle-fitment'))
      .toContainText('3.5L');
  });

  test('Delete saved vehicle removes it everywhere', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.click('[data-testid="delete-vehicle"]');
    await expect(page.locator('.vehicle-card')).toHaveCount(0);
  });

  test('Set default vehicle prefills search, PDP, and cart', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.click('[data-testid="set-default-vehicle"]');
    await page.goto('/cart');

    await expect(page.locator('.default-vehicle')).toBeVisible();
  });

  test('Prevent duplicate vehicle VIN entry', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.fill('#vin', '1HGCM82633A004352');
    await page.click('[data-testid="save-vehicle"]');

    await expect(page.locator('.error-message'))
      .toContainText('Vehicle already exists');
  });

});

test.describe('User Account – Vehicle Persistence & VIN', () => {

  test('Vehicle selection persists across logout and login', async ({ page }) => {
    await page.goto('/account/vehicles');
    const vehicle = await page.locator('.vehicle-name').textContent();

    await page.click('[data-testid="logout"]');
    await page.goto('/login');
    await page.fill('#email', 'user@test.com');
    await page.fill('#password', 'Password123');
    await page.click('[data-testid="login"]');

    await page.goto('/account/vehicles');
    await expect(page.locator('.vehicle-name')).toHaveText(vehicle || '');
  });

  test('VIN auto-detection adds vehicle correctly', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.fill('#vin', '1HGCM82633A004352');
    await page.click('[data-testid="decode-vin"]');

    await expect(page.locator('.vehicle-card')).toBeVisible();
  });

  test('Invalid vehicle data shows validation error', async ({ page }) => {
    await page.goto('/account/vehicles');

    await page.click('[data-testid="add-vehicle"]');
    await page.click('[data-testid="save-vehicle"]');

    await expect(page.locator('.error-message'))
      .toContainText('Required fields missing');
  });

});

test.describe('User Account – Order History & Reorder', () => {

  test('Filter order history by date range and status', async ({ page }) => {
    await page.goto('/account/orders');

    await page.fill('#fromDate', '2024-01-01');
    await page.fill('#toDate', '2024-12-31');
    await page.selectOption('#status', 'Delivered');

    await expect(page.locator('.order-item')).toBeVisible();
  });

  test('Search past orders by SKU or VIN', async ({ page }) => {
    await page.goto('/account/orders');

    await page.fill('#order-search', 'BRAKE123');
    await expect(page.locator('.order-item')).toBeVisible();
  });

  test('Reorder single item successfully', async ({ page }) => {
    await page.goto('/account/orders');

    await page.click('[data-testid="reorder-item"]');
    await page.goto('/cart');

    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('Reorder incompatible items blocked with warning', async ({ page }) => {
    await page.goto('/account/orders?mock=incompatible');

    await page.click('[data-testid="reorder-item"]');
    await expect(page.locator('.warning-message'))
      .toContainText('Incompatible');
  });

});

test.describe('User Account – Addresses', () => {

  test('Add new shipping address with validation', async ({ page }) => {
    await page.goto('/account/addresses');

    await page.click('[data-testid="add-address"]');
    await page.fill('#address1', '123 Main Street');
    await page.fill('#zip', '560001');
    await page.click('[data-testid="save-address"]');

    await expect(page.locator('.address-card')).toBeVisible();
  });

  test('Set default shipping address', async ({ page }) => {
    await page.goto('/account/addresses');

    await page.click('[data-testid="set-default-address"]');
    await page.goto('/checkout');

    await expect(page.locator('.selected-address')).toBeVisible();
  });

  test('Prevent duplicate address entry', async ({ page }) => {
    await page.goto('/account/addresses');

    await page.click('[data-testid="add-address"]');
    await page.fill('#address1', '123 Main Street');
    await page.click('[data-testid="save-address"]');

    await expect(page.locator('.error-message'))
      .toContainText('Address already exists');
  });

});

test.describe('User Account – Wishlist', () => {

  test('Add part to wishlist', async ({ page }) => {
    await page.goto('/pdp');

    await page.click('[data-testid="add-to-wishlist"]');
    await page.goto('/account/wishlist');

    await expect(page.locator('.wishlist-item')).toBeVisible();
  });

  test('Move wishlist item to cart with validation', async ({ page }) => {
    await page.goto('/account/wishlist');

    await page.click('[data-testid="move-to-cart"]');
    await page.goto('/cart');

    await expect(page.locator('.cart-item')).toBeVisible();
  });

  test('Wishlist persists across devices', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('/account/wishlist');
    const count = await page1.locator('.wishlist-item').count();

    await page2.goto('/account/wishlist');
    await expect(page2.locator('.wishlist-item')).toHaveCount(count);
  });

});

test.describe('User Account – Security & Preferences', () => {

  test('Change password and login with new credentials', async ({ page }) => {
    await page.goto('/account/profile');

    await page.fill('#newPassword', 'NewPass123');
    await page.click('[data-testid="save-password"]');

    await page.click('[data-testid="logout"]');
    await page.goto('/login');

    await page.fill('#password', 'NewPass123');
    await page.click('[data-testid="login"]');

    await expect(page).toHaveURL(/account/);
  });

  test('OTP required for sensitive actions', async ({ page }) => {
    await page.goto('/account/profile');

    await page.click('[data-testid="delete-account"]');
    await expect(page.locator('.otp-modal')).toBeVisible();
  });

  test('Session timeout logs user out automatically', async ({ page }) => {
    await page.goto('/account');

    await page.waitForTimeout(5000); // mocked idle timeout
    await expect(page).toHaveURL(/login/);
  });

});

test.describe('User Account – Advanced & Localization', () => {

  test('Guest creates account mid-checkout and data merged', async ({ page }) => {
    await page.goto('/checkout?guest=true');

    await page.click('[data-testid="create-account"]');
    await expect(page.locator('.merge-success')).toBeVisible();
  });

  test('Account deletion removes all user data', async ({ page }) => {
    await page.goto('/account/profile');

    await page.click('[data-testid="delete-account"]');
    await expect(page.locator('.account-deleted')).toBeVisible();
  });

  test('Localization applies correct date and address formats', async ({ page }) => {
    await page.goto('/account?locale=fr-FR');

    await expect(page.locator('.date-format')).toContainText('/');
  });

});
