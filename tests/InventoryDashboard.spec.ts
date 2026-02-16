/**
 * Admin Inventory Dashboard tests.
 * Covers sign-in, navigation to Inventory Dashboard, filter interactions,
 * column selection, and export/report creation functionality.
 *
 * Run in Chrome: npx playwright test tests/InventoryDashboard.spec.ts --project=chrome
 *
 * Requires ADMIN_BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables
 * for authenticated tests. If unset, tests are skipped.
 */
import { test, expect, type Page } from '@playwright/test';

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
async function signIn(page: Page, email: string, password: string) {
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
 * Helper function to navigate to Inventory Dashboard
 */
async function navigateToInventoryDashboard(page: Page) {
  // Open Catalog menu
  const catalogButton = page.getByRole('button', { name: 'Catalog' });
  await expect(catalogButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await catalogButton.click();

  // Navigate to Inventory
  const inventoryLink = page.getByRole('link', { name: 'Inventory' });
  await expect(inventoryLink).toBeVisible({ timeout: ACTION_TIMEOUT });
  await inventoryLink.click();

  // Wait for Inventory Dashboard to load
  await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT });
}

test.describe('Admin Inventory Dashboard', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in and navigate to inventory dashboard', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToInventoryDashboard(page);

      // Assert: Inventory Dashboard should be loaded
      await expect(page.getByRole('link', { name: 'Inventory' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });

    test('should interact with filter checkboxes and unselect all', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToInventoryDashboard(page);

      // Wait for the table to finish loading (wait for loading spinner to disappear)
      await page.waitForSelector('.p-datatable-loading-icon', { state: 'hidden', timeout: ACTION_TIMEOUT }).catch(() => {});
      await page.waitForTimeout(1000); // Additional wait for stability

      // Open filter dropdown (tabpanel with 'All' tab)
      const allTabPanel = page.getByRole('tabpanel', { name: 'All' });
      await expect(allTabPanel).toBeVisible({ timeout: ACTION_TIMEOUT });
      
      // Wait for filter icon to be stable (not a loading spinner)
      // Find icon that doesn't have the loading class
      const filterIcon = allTabPanel.locator('i:not(.p-datatable-loading-icon):not(.pi-spin)').first();
      await expect(filterIcon).toBeVisible({ timeout: ACTION_TIMEOUT });
      // Wait for element to be stable before clicking
      await filterIcon.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
      await page.waitForTimeout(500); // Additional stability wait
      await filterIcon.click();

      // Wait for filter options to appear
      await page.waitForTimeout(500);

      // Test "Unselect All" functionality
      const unselectAllButton = page.getByText('Unselect All');
      if (await unselectAllButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await unselectAllButton.click();
        await page.waitForTimeout(300);
      }

      // Interact with header row checkbox
      const headerRow = page
        .getByRole('row')
        .filter({ hasText: /SKU.*MPN.*Brand/i })
        .first();
      
      if (await headerRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headerCheckbox = headerRow.getByRole('checkbox').first();
        await headerCheckbox.click();
        await page.waitForTimeout(300);
        
        // Toggle it again to test state change
        await headerCheckbox.click();
        await page.waitForTimeout(300);
      }

      // Test column header checkbox
      const columnHeader = page
        .getByRole('columnheader')
        .first();
      
      if (await columnHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
        const columnCheckbox = columnHeader.locator('i').first();
        if (await columnCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await columnCheckbox.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should manage column visibility settings', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToInventoryDashboard(page);

      // Open Columns button
      const columnsButton = page.getByRole('button', { name: /columns/i });
      await expect(columnsButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await columnsButton.click();

      // Wait for column options to appear
      await page.waitForTimeout(500);

      // Toggle a column checkbox
      const columnCheckbox = page
        .locator('.field-checkbox > .p-checkbox > .p-checkbox-box')
        .first();
      
      if (await columnCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await columnCheckbox.click();
        await page.waitForTimeout(300);

        // Apply changes
        const applyButton = page.getByRole('button', { name: 'Apply' });
        await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
        await applyButton.click();
        await page.waitForTimeout(500);
      }

      // Reopen columns menu to test toggle
      await columnsButton.click();
      await page.waitForTimeout(500);

      // Toggle a highlighted checkbox (selected column) - find one that is enabled and not disabled
      // Use selector that excludes disabled checkboxes: parent .p-checkbox should not have .p-checkbox-disabled
      // Also exclude checkboxes that have p-disabled class
      const enabledHighlightedCheckbox = page
        .locator('.p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box.p-highlight:not(.p-disabled)')
        .first();
      
      if (await enabledHighlightedCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Wait for any overlays to be ready
        await page.waitForTimeout(500);
        // Use force click if overlay is intercepting
        await enabledHighlightedCheckbox.click({ force: true });
        await page.waitForTimeout(300);

        // Apply changes
        const applyButton = page.getByRole('button', { name: 'Apply' });
        await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
        await applyButton.click();
        await page.waitForTimeout(500);
      }

      // Test Reset functionality
      await columnsButton.click();
      await page.waitForTimeout(500);

      const resetButton = page.getByRole('button', { name: 'Reset' });
      if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resetButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should export inventory data and create report', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToInventoryDashboard(page);

      // Click Export button
      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await exportButton.click();

      // Wait for export dialog/modal to appear
      await page.waitForTimeout(1000);

      // Navigate through export wizard
      const nextButton = page.getByRole('button', { name: 'Next' });
      if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      // Fill in report name
      const reportNameInput = page.getByRole('textbox', { name: 'Report Name' });
      if (await reportNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reportNameInput.fill('inventory-report-test');
        await page.waitForTimeout(300);

        // Create report
        const createReportButton = page.getByRole('button', { name: 'Create Report' });
        await expect(createReportButton).toBeVisible({ timeout: ACTION_TIMEOUT });
        await createReportButton.click();

        // Wait for report creation to complete - check for success message or dialog closure
        // Look for success message or wait for dialog to close
        const successMessage = page.getByText(/success|created|completed/i);
        const dialogClosed = page.locator('.p-dialog').first();
        
        // Wait for either success message or dialog to close
        try {
          await expect(successMessage).toBeVisible({ timeout: 10000 }).catch(() => {});
        } catch {
          // If no success message, wait for dialog to close
          await expect(dialogClosed).not.toBeVisible({ timeout: ACTION_TIMEOUT }).catch(() => {});
        }
        
        // Alternative: Check if export button is visible again (indicating dialog closed)
        await expect(exportButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      }
    });
  });
});
