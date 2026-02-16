import { test, expect } from '@playwright/test';

/*
  File: reliability.spec.ts
  Module: Reliability & Resilience
  Scope: Retry logic, partial failures, graceful degradation, recovery
*/

const RETRY_DELAY = 3000;

test.describe('Reliability – Search, VIN & Browse', () => {

  test('Search retry on intermittent API failure', async ({ page }) => {
    let attempt = 0;

    await page.route('**/api/search**', async route => {
      attempt++;
      if (attempt === 1) {
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto('/search?q=brake');
    await expect(page.locator('.retry-message')).toBeVisible();
    await page.click('[data-testid="retry-search"]');

    await expect(page.locator('.plp-item')).toBeVisible();
  });

  test('VIN decode retry on failure', async ({ page }) => {
    let calls = 0;

    await page.route('**/api/vin-decode**', async route => {
      calls++;
      calls === 1 ? route.abort() : route.continue();
    });

    await page.goto('/vin-search');
    await page.fill('#vin', '1HGCM82633A004352');
    await page.click('[data-testid="vin-search"]');

    await expect(page.locator('[data-testid="retry-vin"]')).toBeVisible();
    await page.click('[data-testid="retry-vin"]');

    await expect(page.locator('.vehicle-confirmed')).toBeVisible();
  });

  test('Browse site when recommendation service is down', async ({ page }) => {
    await page.route('**/api/recommendations**', route => route.abort());

    await page.goto('/');
    await expect(page.locator('.homepage-content')).toBeVisible();
    await expect(page.locator('.recommendation-fallback')).toBeVisible();
  });

});

test.describe('Reliability – PDP, Pricing & Inventory', () => {

  test('PDP loads when pricing API fails', async ({ page }) => {
    await page.route('**/api/pricing**', route => route.abort());

    await page.goto('/pdp/12345');
    await expect(page.locator('.product-title')).toBeVisible();
    await expect(page.locator('.price-unavailable')).toBeVisible();
  });

  test('PDP loads when inventory API is down (cached)', async ({ page }) => {
    await page.route('**/api/inventory**', route => route.abort());

    await page.goto('/pdp/12345');
    await expect(page.locator('.inventory-fallback')).toBeVisible();
  });

  test('Add to cart when inventory service times out', async ({ page }) => {
    await page.route('**/api/inventory**', async route => {
      await new Promise(r => setTimeout(r, 5000));
      route.continue();
    });

    await page.goto('/pdp/12345');
    await page.click('[data-testid="add-to-cart"]');

    await expect(page.locator('.cart-warning')).toBeVisible();
  });

});

test.describe('Reliability – Cart & Checkout', () => {

  test('Cart state preserved during backend outage', async ({ page }) => {
    await page.goto('/cart');

    await page.route('**/api/cart**', route => route.abort());
    await page.reload();

    await expect(page.locator('.cart-items')).toBeVisible();
    await expect(page.locator('.offline-message')).toBeVisible();
  });

  test('Checkout loads with partial service failure', async ({ page }) => {
    await page.route('**/api/shipping**', route => route.abort());

    await page.goto('/checkout');
    await expect(page.locator('.checkout-summary')).toBeVisible();
    await expect(page.locator('.shipping-error')).toBeVisible();
  });

  test('Shipping rates retry after timeout', async ({ page }) => {
    let attempt = 0;

    await page.route('**/api/shipping**', async route => {
      attempt++;
      attempt === 1 ? route.abort() : route.continue();
    });

    await page.goto('/checkout');
    await page.click('[data-testid="retry-shipping"]');

    await expect(page.locator('.shipping-options')).toBeVisible();
  });

  test('Pricing retry during checkout', async ({ page }) => {
    let calls = 0;

    await page.route('**/api/pricing**', async route => {
      calls++;
      calls === 1 ? route.abort() : route.continue();
    });

    await page.goto('/checkout');
    await expect(page.locator('[data-testid="retry-pricing"]')).toBeVisible();
    await page.click('[data-testid="retry-pricing"]');

    await expect(page.locator('.order-total')).toBeVisible();
  });

});

test.describe('Reliability – Payments & Orders', () => {

  test('Payment retry after gateway timeout', async ({ page }) => {
    let calls = 0;

    await page.route('**/api/payment**', async route => {
      calls++;
      calls === 1 ? route.abort() : route.continue();
    });

    await page.goto('/checkout');
    await page.click('[data-testid="pay-now"]');

    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
    await page.click('[data-testid="retry-payment"]');

    await expect(page.locator('.order-confirmation')).toBeVisible();
  });

  test('Order creation retry after network drop', async ({ page }) => {
    let calls = 0;

    await page.route('**/api/order**', async route => {
      calls++;
      calls === 1 ? route.abort() : route.continue();
    });

    await page.goto('/checkout');
    await page.click('[data-testid="place-order"]');

    await expect(page.locator('[data-testid="retry-order"]')).toBeVisible();
    await page.click('[data-testid="retry-order"]');

    await expect(page.locator('.order-confirmation')).toBeVisible();
  });

});

test.describe('Reliability – Orders, Returns & Tracking', () => {

  test('Order history API retry', async ({ page }) => {
    let calls = 0;

    await page.route('**/api/orders**', async route => {
      calls++;
      calls === 1 ? route.abort() : route.continue();
    });

    await page.goto('/account/orders');
    await page.click('[data-testid="retry-orders"]');

    await expect(page.locator('.order-row')).toBeVisible();
  });

  test('Return request retry on submit failure', async ({ page }) => {
    let attempts = 0;

    await page.route('**/api/returns**', async route => {
      attempts++;
      attempts === 1 ? route.abort() : route.continue();
    });

    await page.goto('/orders/123/return');
    await page.click('[data-testid="submit-return"]');

    await expect(page.locator('[data-testid="retry-return"]')).toBeVisible();
    await page.click('[data-testid="retry-return"]');

    await expect(page.locator('.rma-confirmation')).toBeVisible();
  });

  test('Shipment tracking retry on delayed updates', async ({ page }) => {
    let calls = 0;

    await page.route('**/api/tracking**', async route => {
      calls++;
      calls === 1 ? route.abort() : route.continue();
    });

    await page.goto('/orders/123/tracking');
    await page.click('[data-testid="retry-tracking"]');

    await expect(page.locator('.tracking-status')).toBeVisible();
  });

});

test.describe('Reliability – UX, Responsiveness & Recovery', () => {

  test('UI remains responsive during long API call', async ({ page }) => {
    await page.route('**/api/search**', async route => {
      await new Promise(r => setTimeout(r, 6000));
      route.continue();
    });

    await page.goto('/search?q=battery');
    await page.click('[data-testid="open-menu"]');

    await expect(page.locator('.menu-open')).toBeVisible();
  });

  test('Error message shown with retry option on API failure', async ({ page }) => {
    await page.route('**/api/search**', route => route.abort());

    await page.goto('/search?q=oil');
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('[data-testid="retry-search"]')).toBeVisible();
  });

  test('System recovers after API restored', async ({ page }) => {
    let down = true;

    await page.route('**/api/search**', async route => {
      if (down) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('/search?q=filter');
    await expect(page.locator('.error-message')).toBeVisible();

    down = false;
    await page.reload();

    await expect(page.locator('.plp-item')).toBeVisible();
  });

});
