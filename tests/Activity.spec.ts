import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('.loader-container').click();
  await page.getByRole('button', { name: 'Catalog' }).click();
  await page.getByRole('link', { name: 'Activity', exact: true }).click();
  await page.getByRole('tab', { name: 'Daily Inventory' }).click();
  await page.getByRole('button', { name: ' Columns' }).click();
  await page.getByRole('checkbox').nth(1).click();
  await page.getByRole('checkbox').nth(1).click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: ' Columns' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('tab', { name: 'Marketplace Bulk' }).click();
  await page.getByRole('tab', { name: 'Marketplace Single' }).click();
  await page.locator('.p-paginator-last').click();
  await page.getByRole('tab', { name: 'Marketing Bulk' }).click();
  await page.getByRole('tab', { name: 'Marketing Single' }).click();
});