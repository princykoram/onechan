import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Catalog' }).click();
  await page.getByRole('link', { name: 'Import / Export' }).click();
  await page.getByRole('tab', { name: 'Exports' }).click();
  await page.locator('.p-sortable-column-icon').first().click();
  const page1Promise = page.waitForEvent('popup');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('row', { name: '1 Shipping Pricing report' }).getByRole('img').click();
  const page1 = await page1Promise;
  const download = await downloadPromise;
  await page.getByRole('button', { name: ' Refresh' }).click();
  await page.getByRole('button', { name: ' Add New' }).click();
  await page.getByRole('link', { name: ' Catalog' }).click();
  await page.getByRole('menuitem', { name: 'Products' }).click();
  await page.goto('https://admin.onechanneladmin.com/products/import-export');
  await page.getByRole('tab', { name: 'Exports' }).click();
  await page.locator('.p-paginator-last').click();
});