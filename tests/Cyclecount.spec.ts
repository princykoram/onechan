import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Catalog' }).click();
  await page.getByRole('link', { name: 'Cycle Count' }).click();
  await page.getByText('Pending', { exact: true }).click();
  await page.getByText('Counting').click();
  await page.getByText('Completed').click();
  await page.getByText('Manual').click();
  await page.locator('div').filter({ hasText: /^Automate$/ }).first().click();
  await page.getByText('Reports').click();
  await page.getByText('Cycle Count').nth(2).click();
  await page.getByText('Tasks').click();
  await page.getByText('+ New').click();
  await page.locator('div').filter({ hasText: /^Location$/ }).first().click();
  await page.getByRole('dialog').getByText('Location').click();
  await page.locator('div').filter({ hasText: /^Select Warehouse$/ }).first().click();
  await page.getByText('Onechannel admin (wh1)').click();
  await page.locator('div:nth-child(6) > svg').click();
  await page.getByText('A2-C03', { exact: true }).click();
  await page.locator('polyline').nth(5).click();
  await page.locator('div').filter({ hasText: /^Create$/ }).first().click();
});