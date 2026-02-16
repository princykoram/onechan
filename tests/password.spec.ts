import { test, expect } from '@playwright/test';

/*
  File: password.spec.ts
  Module: Authentication – Password Management
  Scope: Forgot password, reset link validation, password change rules
*/

test.describe('Password – Forgot & Reset Flow', () => {

  test('Forgot password with registered email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('#email', 'registered.user@test.com');
    await page.click('[data-testid="submit-forgot"]');

    await expect(
      page.locator('text=Reset password link has been sent')
    ).toBeVisible();
  });

  test('Forgot password with unregistered email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('#email', 'unknown.user@test.com');
    await page.click('[data-testid="submit-forgot"]');

    await expect(
      page.locator('text=Email not found')
    ).toBeVisible();
  });

});

test.describe('Password – Reset Link Validation', () => {

  test('Reset password using valid link', async ({ page }) => {
    // Normally link comes from email – mocked here
    await page.goto('/reset-password?token=VALID_TOKEN');

    await page.fill('#newPassword', 'NewPassword@123');
    await page.fill('#confirmPassword', 'NewPassword@123');
    await page.click('[data-testid="submit-reset"]');

    await expect(
      page.locator('text=Password updated successfully')
    ).toBeVisible();
  });

  test('Reset password using expired link', async ({ page }) => {
    await page.goto('/reset-password?token=EXPIRED_TOKEN');

    await page.fill('#newPassword', 'NewPassword@123');
    await page.fill('#confirmPassword', 'NewPassword@123');
    await page.click('[data-testid="submit-reset"]');

    await expect(
      page.locator('text=Link expired')
    ).toBeVisible();
  });

  test('Reset password using already used link', async ({ page }) => {
    await page.goto('/reset-password?token=USED_TOKEN');

    await page.fill('#newPassword', 'NewPassword@123');
    await page.fill('#confirmPassword', 'NewPassword@123');
    await page.click('[data-testid="submit-reset"]');

    await expect(
      page.locator('text=Link already used')
    ).toBeVisible();
  });

});

test.describe('Password – Change After Login', () => {

  test('Change password after login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', 'registered.user@test.com');
    await page.fill('#password', 'OldPassword@123');
    await page.click('[data-testid="login"]');

    // Change password
    await page.goto('/account/settings/password');
    await page.fill('#currentPassword', 'OldPassword@123');
    await page.fill('#newPassword', 'UpdatedPassword@123');
    await page.fill('#confirmPassword', 'UpdatedPassword@123');
    await page.click('[data-testid="change-password"]');

    await expect(
      page.locator('text=Password updated successfully')
    ).toBeVisible();
  });

  test('Prevent reuse of old password', async ({ page }) => {
    await page.goto('/account/settings/password');

    await page.fill('#currentPassword', 'UpdatedPassword@123');
    await page.fill('#newPassword', 'UpdatedPassword@123');
    await page.fill('#confirmPassword', 'UpdatedPassword@123');
    await page.click('[data-testid="change-password"]');

    await expect(
      page.locator('text=Cannot reuse old password')
    ).toBeVisible();
  });

});
