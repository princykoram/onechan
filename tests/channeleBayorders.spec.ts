import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Channel' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await page.getByRole('tab', { name: 'Open Orders' }).click();
  await page.getByRole('tab', { name: 'Returned Orders' }).click();
  await page.getByRole('tab', { name: 'Open Returns' }).click();
  await page.getByRole('tab', { name: 'Cancellations' }).click();
});