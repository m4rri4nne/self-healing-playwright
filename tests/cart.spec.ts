import { test, expect, Page } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const BASE_URL = 'https://www.saucedemo.com/';

const log = new HealingLog('./reports/cart-healing-log.json');
test.afterAll(() => log.save());

async function loginAndAddItem(page: Page): Promise<SelfHealingPage> {
  const shPage = createSelfHealingPage(page, log);
  await page.goto(BASE_URL);
  await shPage.fill('[data-test="username"]', 'standard_user');
  await shPage.fill('[data-test="password"]', 'secret_sauce');
  await shPage.click('[data-test="login-button"]');
  await page.waitForSelector('[data-test="title"]');

  await shPage.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await shPage.click('[data-test="shopping-cart-link"]');
  return shPage;
}

test.describe('Your Cart', () => {
  test('lists the added item and allows navigating to checkout', async ({ page }) => {
    await loginAndAddItem(page);

    const cartItem = page.locator('[data-test="inventory-item"]');
    await expect(cartItem).toHaveCount(1);
    await expect(cartItem.locator('[data-test="inventory-item-name"]')).toHaveText('Sauce Labs Backpack');

    await page.click('[data-test="checkout"]');
    await expect(page.locator('[data-test="firstName"]')).toBeVisible();
  });

  test('removes the item from the cart', async ({ page }) => {
    const shPage = await loginAndAddItem(page);

    await shPage.click('[data-test="remove-sauce-labs-backpack"]');
    await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(0);
  });
});

test.describe('Your Cart — self-healing', () => {
  test('heals a broken checkout button selector', async ({ page }) => {
    const shPage = await loginAndAddItem(page);

    // this id does not exist — the engine has to recover using the "Checkout" hint
    await shPage.click('[data-test="wrong-checkout-btn"]', { labelHint: 'Checkout' });

    await expect(page.locator('[data-test="firstName"]')).toBeVisible();

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-checkout-btn"]')
    ).toBe(true);
  });
});
