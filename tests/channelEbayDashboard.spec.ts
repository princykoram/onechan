import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Channel' }).click();
  await page.getByText('ebayDashboard').click();
  await page.getByRole('button', { name: 'Week' }).click();
  await page.getByRole('button', { name: 'Month' }).click();
  await page.getByRole('button', { name: 'Year' }).click();
  await page.getByRole('button', { name: 'Custom' }).click();
  await page.getByRole('button', { name: 'Day' }).click();
  await page.locator('#ebay-dashboard').getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('option', { name: 'Onetruckstore' }).click();
  await page.locator('button').nth(5).click();
  await page.getByRole('checkbox').nth(1).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: ' Export' }).click();
  const download = await downloadPromise;
});