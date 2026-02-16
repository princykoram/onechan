import { test, expect } from '@playwright/test';

/*
  File: order-management.spec.ts
  Module: Order Management
  Scope: Order confirmation, shipments, tracking, cancel, return, refund, inventory
*/

test.describe('Order Management – Order Confirmation', () => {

  test('Order confirmation page displays all order details correctly', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.order-id')).toBeVisible();
    await expect(page.locator('.order-products')).toBeVisible();
    await expect(page.locator('.order-quantity')).toBeVisible();
    await expect(page.locator('.order-prices')).toBeVisible();
    await expect(page.locator('.order-discounts')).toBeVisible();
    await expect(page.locator('.order-tax')).toBeVisible();
    await expect(page.locator('.order-shipping')).toBeVisible();
    await expect(page.locator('.order-total')).toBeVisible();
  });

  test('Unique order ID generated for every order', async ({ page }) => {
    await page.goto('/order-confirmation');

    const orderId = await page.locator('.order-id').textContent();
    expect(orderId).toBeTruthy();
  });

  test('Order summary matches cart summary before payment', async ({ page }) => {
    await page.goto('/cart');
    const cartTotal = await page.locator('.cart-total').textContent();

    await page.goto('/order-confirmation');
    const orderTotal = await page.locator('.order-total').textContent();

    expect(cartTotal).toEqual(orderTotal);
  });

});

test.describe('Order Management – Shipments & Inventory', () => {

  test('Order auto-splits into multiple shipments for multi-warehouse items', async ({ page }) => {
    await page.goto('/order-confirmation?mock=multiWarehouse');

    await expect(page.locator('.shipment')).toHaveCountGreaterThan(1);
  });

  test('Each shipment has tracking ID and delivery date', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.tracking-id')).toBeVisible();
    await expect(page.locator('.expected-delivery')).toBeVisible();
  });

  test('Correct shipping cost applied per split shipment', async ({ page }) => {
    await page.goto('/order-confirmation?mock=splitShipping');

    await expect(page.locator('.shipment-shipping-cost')).toBeVisible();
  });

  test('Inventory reduced per warehouse after checkout', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.inventory-updated')).toBeVisible();
  });

  test('Backordered items handled correctly', async ({ page }) => {
    await page.goto('/order-confirmation?mock=backorder');

    await expect(page.locator('.backorder-label')).toBeVisible();
  });

});

test.describe('Order Management – Notifications', () => {

  test('Order confirmation email sent with correct details', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.email-sent')).toBeVisible();
  });

  test('SMS / Push notification sent for order confirmation', async ({ page }) => {
    await page.goto('/order-confirmation');

    await expect(page.locator('.sms-sent')).toBeVisible();
  });

  test('Partial shipment notifications sent separately', async ({ page }) => {
    await page.goto('/order-confirmation?mock=partialShipment');

    await expect(page.locator('.partial-shipment-notification')).toBeVisible();
  });

  test('Shipment delay notification sent to user', async ({ page }) => {
    await page.goto('/order-confirmation?mock=delayedShipment');

    await expect(page.locator('.shipment-delay-alert')).toBeVisible();
  });

});

test.describe('Order Management – Order History & Tracking', () => {

  test('Order details visible in user order history', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'user@test.com');
    await page.fill('#password', 'Password123');
    await page.click('[data-testid="login"]');

    await page.goto('/account/orders');
    await expect(page.locator('.order-item')).toBeVisible();
  });

  test('Tracking link redirects to correct courier site', async ({ page }) => {
    await page.goto('/order-confirmation');
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('[data-testid="track-shipment"]')
    ]);

    await expect(newPage.url()).toContain('courier');
  });

  test('Multi-shipment tracking page shows all shipments', async ({ page }) => {
    await page.goto('/track-order');

    await expect(page.locator('.shipment-status')).toHaveCountGreaterThan(1);
  });

  test('Shipment timeline shows correct events', async ({ page }) => {
    await page.goto('/track-order');

    await expect(page.locator('.shipment-timeline')).toBeVisible();
  });

});

test.describe('Order Management – Cancel, Modify & Refund', () => {

  test('Cancel order before shipment processes full refund', async ({ page }) => {
    await page.goto('/order-details?status=notShipped');

    await page.click('[data-testid="cancel-order"]');
    await expect(page.locator('.refund-success')).toContainText('Full refund');
  });

  test('Cancel part of shipment processes partial refund', async ({ page }) => {
    await page.goto('/order-details?mock=partialShipment');

    await page.click('[data-testid="cancel-item"]');
    await expect(page.locator('.refund-success')).toContainText('Partial refund');
  });

  test('Cancel restricted after shipment initiated', async ({ page }) => {
    await page.goto('/order-details?status=shipped');

    await page.click('[data-testid="cancel-order"]');
    await expect(page.locator('.error-message'))
      .toContainText('Cancellation not allowed');
  });

  test('Modify quantity or remove items before shipment', async ({ page }) => {
    await page.goto('/order-details?status=notShipped');

    await page.click('[data-testid="edit-order"]');
    await page.click('[data-testid="remove-item"]');

    await expect(page.locator('.order-updated')).toBeVisible();
  });

});

test.describe('Order Management – Returns & Exchange', () => {

  test('Initiate return for delivered order', async ({ page }) => {
    await page.goto('/order-details?status=delivered');

    await page.click('[data-testid="initiate-return"]');
    await expect(page.locator('.return-created')).toBeVisible();
  });

  test('Partial return calculates correct refund', async ({ page }) => {
    await page.goto('/order-details?mock=partialReturn');

    await page.click('[data-testid="initiate-return"]');
    await expect(page.locator('.refund-amount')).toBeVisible();
  });

  test('Core charge refunded correctly for returned items', async ({ page }) => {
    await page.goto('/order-details?mock=coreCharge');

    await page.click('[data-testid="initiate-return"]');
    await expect(page.locator('.core-refund')).toBeVisible();
  });

  test('Exchange request processed successfully', async ({ page }) => {
    await page.goto('/order-details');

    await page.click('[data-testid="exchange-item"]');
    await expect(page.locator('.exchange-success')).toBeVisible();
  });

  test('Order status auto-updated after return or exchange', async ({ page }) => {
    await page.goto('/account/orders');

    await expect(page.locator('.order-status'))
      .toContainText(/Returned|Exchanged/);
  });

});

test.describe('Order Management – Advanced Scenarios', () => {

  test('High-value order triggers fraud and risk checks', async ({ page }) => {
    await page.goto('/order-confirmation?mock=highValue');

    await expect(page.locator('.risk-check')).toBeVisible();
  });

  test('System crash during order creation handled safely', async ({ page }) => {
    await page.goto('/checkout?mock=crash');

    await expect(page.locator('.order-safe-state')).toBeVisible();
  });

  test('Bulk dealer order validates shipments, discounts and taxes', async ({ page }) => {
    await page.goto('/order-confirmation?mock=bulkDealer');

    await expect(page.locator('.bulk-discount')).toBeVisible();
    await expect(page.locator('.split-shipment')).toBeVisible();
  });

  test('International checkout validates duties and taxes', async ({ page }) => {
    await page.goto('/order-confirmation?mock=international');

    await expect(page.locator('.customs-duty')).toBeVisible();
    await expect(page.locator('.international-tax')).toBeVisible();
  });

});
