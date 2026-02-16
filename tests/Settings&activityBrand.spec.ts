import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Catalog' }).click();
  await page.getByRole('link', { name: 'Catalogs' }).click();
  await page.getByRole('button', { name: ' Add New' }).click();
  await page.getByRole('textbox', { name: 'Enter name' }).click();
  await page.getByRole('textbox', { name: 'Enter name' }).fill('one');
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('option', { name: 'Active' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
  await page.getByRole('option', { name: 'Price Decrease' }).click();
  await page.getByRole('spinbutton', { name: 'Enter value' }).click();
  await page.getByRole('checkbox').nth(1).click();
  await page.getByRole('button', { name: ' Save' }).click();
});