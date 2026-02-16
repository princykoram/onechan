import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  
  // Fill in email
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  
  // Fill in password
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  
  // Click login and wait for navigation
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForLoadState('networkidle');
  
  // Click Channel button and wait for menu to appear
  const channelButton = page.getByRole('button', { name: 'Channel' });
  await channelButton.waitFor({ state: 'visible', timeout: 10000 });
  
  // Try hovering first, then clicking
  await channelButton.hover();
  await page.waitForTimeout(1000);
  await channelButton.click();
  
  // Wait for either navigation or menu to appear
  await Promise.race([
    page.waitForURL('**/channel/**', { timeout: 5000 }).catch(() => null),
    page.waitForTimeout(3000)
  ]);
  
  // Try multiple strategies to find Message-Desk link
  // First, try to find it in a menu/dropdown
  let messageDeskLink = null;
  
  // Strategy 1: Look for link with exact text
  try {
    messageDeskLink = page.getByRole('link', { name: 'Message-Desk' });
    await messageDeskLink.waitFor({ state: 'visible', timeout: 5000 });
  } catch (e1) {
    try {
      // Strategy 2: Try without hyphen
      messageDeskLink = page.getByRole('link', { name: 'Message Desk' });
      await messageDeskLink.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e2) {
      try {
        // Strategy 3: Try case-insensitive regex
        messageDeskLink = page.getByRole('link', { name: /Message.*Desk/i });
        await messageDeskLink.waitFor({ state: 'visible', timeout: 5000 });
      } catch (e3) {
        try {
          // Strategy 4: Try using locator with text
          messageDeskLink = page.locator('a:has-text("Message-Desk")');
          await messageDeskLink.waitFor({ state: 'visible', timeout: 5000 });
        } catch (e4) {
          try {
            // Strategy 5: Try with space instead of hyphen
            messageDeskLink = page.locator('a:has-text("Message Desk")');
            await messageDeskLink.waitFor({ state: 'visible', timeout: 5000 });
          } catch (e5) {
            // Strategy 6: Try finding in any visible menu/nav
            const menuLinks = page.locator('nav a, [role="menu"] a, [role="menuitem"] a, .menu a, .dropdown a');
            const count = await menuLinks.count();
            for (let i = 0; i < count; i++) {
              const link = menuLinks.nth(i);
              const text = await link.textContent();
              if (text && /message.*desk|desk.*message/i.test(text.trim())) {
                const isVisible = await link.isVisible();
                if (isVisible) {
                  messageDeskLink = link;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  
  if (!messageDeskLink) {
    // Last resort: navigate directly if we can construct the URL
    // Or try to find any clickable element with message/desk text
    const allClickable = page.locator('a, button, [role="link"], [role="menuitem"]');
    const count = await allClickable.count();
    for (let i = 0; i < count; i++) {
      const element = allClickable.nth(i);
      const text = await element.textContent();
      if (text && /message.*desk|desk.*message/i.test(text.trim())) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          messageDeskLink = element;
          break;
        }
      }
    }
  }
  
  if (!messageDeskLink) {
    throw new Error('Could not find Message-Desk link. Please check if the menu structure has changed.');
  }
  
  // Wait for link to be actionable and click
  await messageDeskLink.waitFor({ state: 'attached', timeout: 10000 });
  // Try to click directly, if that fails, try force click
  try {
    await messageDeskLink.click({ timeout: 10000 });
  } catch (e) {
    // If normal click fails, try force click
    await messageDeskLink.click({ force: true, timeout: 10000 });
  }
  await page.waitForLoadState('networkidle');
  
  // Wait for and click Webstore Messages tab
  await page.getByRole('tab', { name: 'Webstore Messages' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('tab', { name: 'Webstore Messages' }).click();
  await page.waitForTimeout(500);
  
  // Click Open Cases tab
  await page.getByRole('tab', { name: 'Open Cases' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('tab', { name: 'Open Cases' }).click();
  await page.waitForTimeout(500);
  
  // Click Webstore Messages tab again
  await page.getByRole('tab', { name: 'Webstore Messages' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('tab', { name: 'Webstore Messages' }).click();
});