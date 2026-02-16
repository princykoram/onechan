import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Catalog' }).click();
  await page.getByRole('link', { name: 'Images' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('option', { name: 'Week' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
  await page.getByRole('option', { name: 'Amazon Us A3STI84ZSLQ1Z7' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();
  await page.getByRole('option', { name: '1CA', exact: true }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: ' Save Data' }).click();
  await page.getByRole('row', { name: 'SKU MPN Brand Title Size Style : : : : : : AIR_LIFT57230_DUPLICATE1 57230 AIR' }).locator('input[type="file"]').click();
  await page.locator('.p-multiselect-trigger-icon').first().click();
  await page.getByText('Amazon Us A3STI84ZSLQ1Z7', { exact: true }).click();
  await page.getByRole('cell', { name: '1 Amazon Us A3STI84ZSLQ1Z7 ' }).click();
  await page.locator('div:nth-child(2) > .p-multiselect-trigger > .p-multiselect-trigger-icon').first().click();
  await page.locator('.p-multiselect.p-component.p-inputwrapper.p-focus > .p-multiselect-trigger > .p-multiselect-trigger-icon').click();
  await page.locator('.p-paginator-last').click();
});