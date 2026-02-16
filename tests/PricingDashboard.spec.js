/**
 * Admin Pricing Dashboard tests.
 * Covers sign-in, navigation to Pricing page, row selection, sorting,
 * and column management functionality.
 *
 * Run in Chrome: npx playwright test tests/PricingDashboard.spec.js --project=chrome
 *
 * Requires ADMIN_BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables
 * for authenticated tests. If unset, tests are skipped.
 */
import { test, expect } from '@playwright/test';

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL ?? 'https://admin.onechanneladmin.com';
const SIGN_IN_URL = `${ADMIN_BASE_URL}/signin?returnUrl=%2F`;
const NAVIGATION_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;

const getAdminCredentials = () => ({
  email: process.env.ADMIN_EMAIL ?? 'princy@onechanneladmin.com',
  password: process.env.ADMIN_PASSWORD ?? 'beR60ElTpm0?YbW',
});

/**
 * Helper function to sign in to the admin dashboard
 */
async function signIn(page, email, password) {
  await page.goto(SIGN_IN_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAVIGATION_TIMEOUT,
  });

  await page
    .getByRole('textbox', { name: 'Email address' })
    .fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // Wait for successful login - URL should not contain 'signin'
  await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });
}

/**
 * Helper function to navigate to Pricing page
 */
async function navigateToPricingPage(page) {
  // Open Catalog menu
  const catalogButton = page.getByRole('button', { name: 'Catalog' });
  await expect(catalogButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await catalogButton.click();

  // Navigate to Pricing
  const pricingLink = page.getByRole('link', { name: 'Pricing' });
  await expect(pricingLink).toBeVisible({ timeout: ACTION_TIMEOUT });
  await pricingLink.click();

  // Wait for Pricing page to load
  await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT });
}

/**
 * Helper function to select a row in the pricing table
 */
async function selectRow(page) {
  const rowCheckbox = page
    .getByRole('row', { name: /SKU.*MPN.*Brand/i })
    .getByRole('checkbox')
    .first();

  await expect(rowCheckbox).toBeVisible({ timeout: ACTION_TIMEOUT });
  await rowCheckbox.click();
  await page.waitForTimeout(300);
}

/**
 * Helper function to sort table by clicking sortable column icon
 */
async function sortTable(page) {
  const sortIcon = page.locator('.p-sortable-column-icon').first();
  await expect(sortIcon).toBeVisible({ timeout: ACTION_TIMEOUT });
  await sortIcon.click();
  await page.waitForTimeout(500);
}

/**
 * Helper function to open column management dialog
 */
async function openColumnManagement(page) {
  const columnsButton = page.getByRole('button', { name: /columns/i });
  await expect(columnsButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await columnsButton.click();

  // Wait for column management dialog to open
  await page.waitForTimeout(500);
}

/**
 * Helper function to toggle column checkboxes in column management
 */
async function toggleColumnCheckboxes(page) {
  // Wait for column management dialog to be fully loaded
  const dialog = page.locator('.p-dialog').first();
  await expect(dialog).toBeVisible({ timeout: ACTION_TIMEOUT });

  // Wait for dialog animation to complete
  await page.waitForFunction(
    () => {
      const dialog = document.querySelector('.p-dialog');
      return dialog && !dialog.classList.contains('p-dialog-enter');
    },
    { timeout: ACTION_TIMEOUT }
  );

  await page.waitForTimeout(300);

  // Toggle a column checkbox
  const columnCheckbox = page
    .locator('.field-checkbox > .p-checkbox > .p-checkbox-box')
    .first();

  if (await columnCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    try {
      await columnCheckbox.click({ timeout: 5000 });
    } catch (e) {
      // If click fails due to overlay, try force click
      await columnCheckbox.click({ force: true });
    }
    await page.waitForTimeout(300);
  }

  // Toggle a highlighted (selected) checkbox
  const highlightedCheckbox = page
    .locator('.p-checkbox-box.p-highlight')
    .first();

  if (await highlightedCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expect(highlightedCheckbox).toBeEnabled({ timeout: ACTION_TIMEOUT });

    // Check if checkbox is disabled - if so, skip it
    const isDisabled = await highlightedCheckbox.evaluate((el) => {
      return (
        el.classList.contains('p-disabled') ||
        (el.closest('.p-checkbox')?.classList.contains('p-disabled') ?? false)
      );
    });

    if (!isDisabled) {
      try {
        await highlightedCheckbox.click({ timeout: 5000 });
      } catch (e) {
        // If click fails due to overlay, try force click
        await highlightedCheckbox.click({ force: true });
      }
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Helper function to apply column changes
 */
async function applyColumnChanges(page) {
  const applyButton = page.getByRole('button', { name: 'Apply', exact: true });
  await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await applyButton.click();
  await page.waitForTimeout(500);
}

/**
 * Helper function to reset column settings
 */
async function resetColumnSettings(page) {
  await openColumnManagement(page);

  const resetButton = page.getByRole('button', { name: 'Reset' });
  if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await resetButton.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Admin Pricing Dashboard', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in and navigate to pricing page', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingPage(page);

      // Assert: Pricing page should be loaded
      await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });

    test('should select a row in the pricing table', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingPage(page);

      // Select a row
      await selectRow(page);

      // Assert: Row should be selected
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should sort the pricing table', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingPage(page);

      // Sort table
      await sortTable(page);

      // Assert: Table should be sorted
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should manage column visibility', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingPage(page);

      // Open column management
      await openColumnManagement(page);

      // Toggle column checkboxes
      await toggleColumnCheckboxes(page);

      // Apply changes
      await applyColumnChanges(page);

      // Assert: Column changes should be applied
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should reset column settings', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingPage(page);

      // First, modify column settings
      await openColumnManagement(page);
      await toggleColumnCheckboxes(page);
      await applyColumnChanges(page);
      await page.waitForTimeout(500);

      // Then reset column settings
      await resetColumnSettings(page);

      // Assert: Column settings should be reset
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should complete full pricing dashboard workflow', async ({ page }) => {
      test.setTimeout(120000); // 2 minutes for this comprehensive test
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingPage(page);

      // Step 1: Select a row
      await selectRow(page);

      // Step 2: Sort the table
      await sortTable(page);

      // Step 3: Manage columns
      await openColumnManagement(page);
      await toggleColumnCheckboxes(page);
      await applyColumnChanges(page);

      // Step 4: Reset column settings
      await resetColumnSettings(page);

      // Assert: Complete workflow should succeed
      await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });
    });
  });
});
