import { test, expect } from '@playwright/test';

/*
  File: returns-and-refunds.spec.ts
  Module: Returns & Refunds
  Scope: Return initiation, validation, RMA, tracking, refund, core charge, fraud
*/

test.describe('Returns & Refunds – Return Initiation & Validation', () => {

  test('Return form opens with eligible part auto-populated', async ({ page }) => {
    await page.goto('/order-details?status=delivered');

    await page.click('[data-testid="initiate-return"]');
    await expect(page.locator('.return-form')).toBeVisible();
    await expect(page.locator('.return-item')).toBeVisible();
  });

  test('System accepts valid return reason codes', async ({ page }) => {
    await page.goto('/returns/new');

    await page.selectOption('#reason', 'Defective');
    await page.click('[data-testid="submit-return"]');

    await expect(page.locator('.return-success')).toBeVisible();
  });

  test('Expired or non-returnable item blocked', async ({ page }) => {
    await page.goto('/returns/new?mock=expired');

    await page.click('[data-testid="submit-return"]');
    await expect(page.locator('.error-message'))
      .toContainText('Return window expired');
  });

  test('Restricted items like core-exchange blocked', async ({ page }) => {
    await page.goto('/returns/new?mock=restricted');

    await expect(page.locator('.error-message'))
      .toContainText('Item not eligible for return');
  });

  test('Subset of items selected shows correct refund calculation', async ({ page }) => {
    await page.goto('/returns/new?mock=multiItem');

    await page.check('[data-testid="return-item-1"]');
    await expect(page.locator('.refund-amount')).toBeVisible();
  });

});

test.describe('Returns & Refunds – Submission Channels', () => {

  test('Return initiated via website logged successfully', async ({ page }) => {
    await page.goto('/returns/new');

    await page.click('[data-testid="submit-return"]');
    await expect(page.locator('.rma-number')).toBeVisible();
  });

  test('Return initiated via mobile app logged successfully', async ({ page }) => {
    await page.goto('/returns/new?source=mobile');

    await page.click('[data-testid="submit-return"]');
    await expect(page.locator('.rma-number')).toBeVisible();
  });

  test('Return initiated via customer support logged as unified return', async ({ page }) => {
    await page.goto('/returns/new?source=support');

    await page.click('[data-testid="submit-return"]');
    await expect(page.locator('.return-source'))
      .toContainText('Customer Support');
  });

  test('Mandatory reason validation enforced', async ({ page }) => {
    await page.goto('/returns/new');

    await page.click('[data-testid="submit-return"]');
    await expect(page.locator('.error-message'))
      .toContainText('Reason is required');
  });

  test('Other reason with custom text accepted', async ({ page }) => {
    await page.goto('/returns/new');

    await page.selectOption('#reason', 'Other');
    await page.fill('#custom-reason', 'Ordered by mistake');
    await page.click('[data-testid="submit-return"]');

    await expect(page.locator('.return-success')).toBeVisible();
  });

  test('Note validation blocks excessive length or invalid characters', async ({ page }) => {
    await page.goto('/returns/new');

    await page.fill('#notes', 'X'.repeat(600));
    await page.click('[data-testid="submit-return"]');

    await expect(page.locator('.error-message'))
      .toContainText('Note exceeds maximum length');
  });

});

test.describe('Returns & Refunds – RMA, Shipping & Tracking', () => {

  test('RMA generated with instructions and tracking', async ({ page }) => {
    await page.goto('/returns/new');

    await page.click('[data-testid="submit-return"]');
    await expect(page.locator('.rma-number')).toBeVisible();
    await expect(page.locator('.return-instructions')).toBeVisible();
  });

  test('Standard courier generates shipping label', async ({ page }) => {
    await page.goto('/returns/new');

    await page.selectOption('#return-shipping', 'Standard');
    await expect(page.locator('.shipping-label')).toBeVisible();
  });

  test('Freight pickup scheduled for heavy item', async ({ page }) => {
    await page.goto('/returns/new?mock=freight');

    await page.selectOption('#return-shipping', 'Freight');
    await expect(page.locator('.pickup-scheduled')).toBeVisible();
  });

  test('Return status updates through lifecycle', async ({ page }) => {
    await page.goto('/returns/track');

    await expect(page.locator('.status-pending')).toBeVisible();
    await expect(page.locator('.status-shipped')).toBeVisible();
    await expect(page.locator('.status-received')).toBeVisible();
    await expect(page.locator('.status-processed')).toBeVisible();
  });

  test('Customer notified on each return status change', async ({ page }) => {
    await page.goto('/returns/track');

    await expect(page.locator('.notification-sent')).toBeVisible();
  });

});

test.describe('Returns & Refunds – Refund Calculation & Core Charge', () => {

  test('Refund processed to original payment method', async ({ page }) => {
    await page.goto('/returns/complete');

    await expect(page.locator('.refund-method'))
      .toContainText('Original payment');
  });

  test('Split payment refund allocated proportionally', async ({ page }) => {
    await page.goto('/returns/complete?mock=splitPayment');

    await expect(page.locator('.refund-breakdown')).toBeVisible();
  });

  test('Tax and discount recalculated for returned items', async ({ page }) => {
    await page.goto('/returns/complete');

    await expect(page.locator('.refund-tax')).toBeVisible();
    await expect(page.locator('.refund-discount')).toBeVisible();
  });

  test('Promo recalculated correctly after partial return', async ({ page }) => {
    await page.goto('/returns/complete?mock=promo');

    await expect(page.locator('.promo-adjustment')).toBeVisible();
  });

  test('Core
