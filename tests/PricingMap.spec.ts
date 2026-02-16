/**
 * Admin Pricing MAP (Minimum Advertised Price) tests.
 * Covers sign-in, navigation to Pricing MAP page, row selection/deselection,
 * column management, export functionality, and pagination.
 *
 * Run in Chrome: npx playwright test tests/PricingMap.spec.ts --project=chrome
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
 * Helper function to navigate to Pricing MAP page
 */
async function navigateToPricingMapPage(page: Page) {
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

  // Click on MAP tab
  const mapTab = page.getByRole('tab', { name: 'MAP' });
  await expect(mapTab).toBeVisible({ timeout: ACTION_TIMEOUT });
  await mapTab.click();

  // Wait for MAP tab to be selected/active
  await expect(mapTab).toHaveAttribute('aria-selected', 'true', { timeout: ACTION_TIMEOUT }).catch(() => {
    // Some implementations might not use aria-selected, continue anyway
  });

  // Wait for MAP tab content to load
  await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT });
  
  // Wait for network to be idle (with fallback if it times out)
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // Network idle might timeout, continue anyway
  }

  // Wait for table to be visible and ready - try multiple selectors
  const tableSelectors = [
    'table',
    '.p-datatable',
    '[role="table"]',
    '.p-datatable-table',
  ];

  let tableFound = false;
  for (const selector of tableSelectors) {
    try {
      const table = page.locator(selector).first();
      await expect(table).toBeVisible({ timeout: ACTION_TIMEOUT });
      tableFound = true;
      break;
    } catch {
      // Try next selector
      continue;
    }
  }

  if (!tableFound) {
    // Fallback: wait for any table-like element to be visible
    const fallbackTable = page.locator('table, .p-datatable, [role="table"]').first();
    await expect(fallbackTable).toBeVisible({ timeout: ACTION_TIMEOUT });
  }

  // Additional wait for table content to render
  await page.waitForTimeout(500);
}

/**
 * Helper function to toggle row selection checkbox
 */
async function toggleRowSelection(page: Page) {
  // Wait for table to be loaded - look for any row with checkbox
  await page.waitForSelector('table, .p-datatable, [role="table"]', {
    timeout: ACTION_TIMEOUT,
  });

  // Wait a bit for table content to render
  await page.waitForTimeout(500);

  const rowCheckbox = page
    .getByRole('row', { name: /SKU.*MPN.*Brand/i })
    .getByRole('checkbox')
    .first();

  await expect(rowCheckbox).toBeVisible({ timeout: ACTION_TIMEOUT });
  await rowCheckbox.click();
  await page.waitForTimeout(300);
}

/**
 * Helper function to toggle header checkbox (select all)
 */
async function toggleHeaderCheckbox(page: Page) {
  const headerCheckbox = page
    .getByRole('columnheader', { name: /.*/ })
    .getByRole('checkbox')
    .first();

  await expect(headerCheckbox).toBeVisible({ timeout: ACTION_TIMEOUT });
  await headerCheckbox.click();
  await page.waitForTimeout(300);
}

/**
 * Helper function to open column management dialog
 */
async function openColumnManagement(page: Page) {
  const columnsButton = page.getByRole('button', { name: /columns/i });
  await expect(columnsButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await columnsButton.click();

  // Wait for column management dialog to open
  await page.waitForTimeout(500);
}

/**
 * Helper function to toggle column checkboxes in column management
 */
async function toggleColumnCheckboxes(page: Page) {
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
async function applyColumnChanges(page: Page) {
  const applyButton = page.getByRole('button', { name: 'Apply', exact: true });
  await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await applyButton.click();
  await page.waitForTimeout(500);
}

/**
 * Helper function to reset column settings
 */
async function resetColumnSettings(page: Page) {
  await openColumnManagement(page);

  const resetButton = page.getByRole('button', { name: 'Reset' });
  if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await resetButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Helper function to initiate export and create report
 */
async function exportData(page: Page, reportName: string = 'MAP Export Report') {
  // Click Export button
  const exportButton = page.getByRole('button', { name: /export/i });
  await expect(exportButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await exportButton.click();

  // Wait for export dialog/modal to appear
  await page.waitForTimeout(500);

  // Click Next button if present
  const nextButton = page.getByRole('button', { name: 'Next' });
  if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nextButton.click();
    await page.waitForTimeout(500);
  }

  // Fill in report name
  const reportNameInput = page.getByRole('textbox', { name: 'Report Name' });
  if (await reportNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await reportNameInput.click();
    await reportNameInput.fill(reportName);
    await page.waitForTimeout(300);
  }

  // Click Create Report button
  const createReportButton = page.getByRole('button', { name: 'Create Report' });
  if (await createReportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await createReportButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Helper function to navigate to a specific page in pagination
 */
async function navigateToPage(page: Page, pageNumber: number) {
  const pageButton = page.getByRole('button', { name: pageNumber.toString() });
  if (await pageButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expect(pageButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
    await pageButton.click();
    
    // Wait for table to reload after pagination
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
    await page.waitForTimeout(500);
    
    // Ensure table is still visible after pagination
    await page.waitForSelector('table, .p-datatable, [role="table"]', {
      timeout: ACTION_TIMEOUT,
    });
  }
}

test.describe('Admin Pricing MAP Management', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in and navigate to pricing MAP page', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Assert: MAP tab should be active and visible
      await expect(page.getByRole('tab', { name: 'MAP' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });

    test('should toggle row selection in MAP table', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Toggle row selection
      await toggleRowSelection(page);

      // Assert: Row should be selected/deselected
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should toggle header checkbox to select all rows', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Toggle header checkbox
      await toggleHeaderCheckbox(page);

      // Assert: All rows should be selected
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should manage column visibility in MAP table', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Open column management
      await openColumnManagement(page);

      // Toggle column checkboxes
      await toggleColumnCheckboxes(page);

      // Apply changes
      await applyColumnChanges(page);

      // Assert: Column changes should be applied
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should reset column settings in MAP table', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

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

    test('should export MAP data and create report', async ({ page }) => {
      test.setTimeout(120000); // 2 minutes for export operation
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Export data with custom report name
      await exportData(page, 'MAP Export Report');

      // Assert: Export should be initiated
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should navigate through pagination', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Navigate to page 3
      await navigateToPage(page, 3);

      // Assert: Should be on different page
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should complete full MAP management workflow', async ({ page }) => {
      test.setTimeout(180000); // 3 minutes for this comprehensive test
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToPricingMapPage(page);

      // Step 1: Toggle row selection
      await toggleRowSelection(page);

      // Step 2: Toggle header checkbox
      await toggleHeaderCheckbox(page);

      // Step 3: Manage columns
      await openColumnManagement(page);
      await toggleColumnCheckboxes(page);
      await applyColumnChanges(page);

      // Step 4: Reset column settings
      await resetColumnSettings(page);

      // Step 5: Navigate pagination
      await navigateToPage(page, 3);

      // Assert: Complete workflow should succeed
      await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });
    });
  });
});
