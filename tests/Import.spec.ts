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
  await page.locator('.p-sortable-column-icon').first().click();
  await page.getByRole('button', { name: ' Refresh' }).click();
  await page.getByRole('button', { name: ' Import' }).click();
  await page.locator('.p-field > .p-dropdown > .p-dropdown-trigger').click();
  await page.getByRole('option', { name: 'Inventory' }).click();
  await page.locator('.p-field > div > .p-dropdown > .p-dropdown-trigger').click();
  await page.getByRole('option', { name: 'New Template to test' }).click();
  await page.locator('div:nth-child(3) > .p-dropdown > .p-dropdown-trigger').click();
  await page.getByRole('option', { name: 'Update Exisiting', exact: true }).click();
  await page.getByRole('dialog', { name: 'Import files' }).locator('i').click();
  await page.getByRole('dialog', { name: 'Import files' }).locator('i').click();
  await page.getByRole('dialog', { name: 'Import files' }).locator('i').click();
  await page.locator('.file-upload').click();
  await page.getByRole('button', { name: 'Choose File' }).setInputFiles('Catalog.txt');
  await page.getByRole('button', { name: 'Apply' }).click();
});