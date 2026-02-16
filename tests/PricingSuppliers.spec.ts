import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Catalog' }).click();
  await page.getByRole('link', { name: 'Pricing' }).click();
  await page.getByRole('tab', { name: 'Supplier' }).click();
  // Wait for loading icon to disappear
  await page.getByRole('tabpanel', { name: 'Supplier' }).locator('i.p-datatable-loading-icon').waitFor({ state: 'hidden' });
  // Click the angle-down icon specifically
  await page.getByRole('tabpanel', { name: 'Supplier' }).locator('i.pi-angle-down').click();
  // Wait for the dropdown menu to appear and use regex to match dynamic record count
  const selectAllButton = page.getByText(/Select All \d+ records/);
  await expect(selectAllButton).toBeVisible({ timeout: 30000 });
  await selectAllButton.click();
  await page.getByRole('columnheader', { name: ' ' }).locator('i').click();
  await page.getByRole('columnheader', { name: ' ' }).locator('i').click();
  // Wait for DOM to stabilize after column header clicks
  await page.waitForTimeout(500);
  // Re-open dropdown if it closed, then wait for Unselect All button
  await page.getByRole('tabpanel', { name: 'Supplier' }).locator('i.pi-angle-down').click();
  const unselectAllButton = page.getByText('Unselect All');
  await expect(unselectAllButton).toBeVisible({ timeout: 30000 });
  await unselectAllButton.click();
  await page.getByRole('button', { name: ' Columns' }).click();
  await page.locator('.field-checkbox > .p-checkbox > .p-checkbox-box').click();
  await page.locator('.p-checkbox-box.p-highlight').first().click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(5).click();
  await page.getByRole('button', { name: ' Columns' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: ' Export' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Report Name' }).click();
  await page.getByRole('textbox', { name: 'Report Name' }).fill('one');
  await page.getByRole('button', { name: 'Create Report' }).click();
});