import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Channel' }).click();
  await page.getByRole('link', { name: 'Sellers Info' }).click();
  await page.getByRole('row', { name: ' Brand   Total Products' }).locator('i').click();
  await page.locator('div').filter({ hasText: /^Select All 1655 records$/ }).click();
  await page.getByText('Unselect All').click();
  await page.getByRole('button', { name: ' Columns' }).click();
  await page.locator('.field-checkbox > .p-checkbox > .p-checkbox-box').click();
  await page.locator('.p-checkbox-box.p-highlight').first().click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: ' Columns' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: ' Export' }).click();
  await page.locator('.field-checkbox > .p-checkbox > .p-checkbox-box').click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('textbox', { name: 'Report Name' }).click();
  await page.getByRole('textbox', { name: 'Report Name' }).fill('1');
  await page.getByRole('button', { name: 'Create Report' }).click();
});