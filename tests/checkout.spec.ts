import { test, expect, Page } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const BASE_URL = 'https://www.saucedemo.com/';

const log = new HealingLog('./reports/checkout-healing-log.json');
test.afterAll(() => log.save());

async function loginAddItemAndGoToCheckout(page: Page): Promise<SelfHealingPage> {
  const shPage = createSelfHealingPage(page, log);
  await page.goto(BASE_URL);
  await shPage.fill('[data-test="username"]', 'standard_user');
  await shPage.fill('[data-test="password"]', 'secret_sauce');
  await shPage.click('[data-test="login-button"]');
  await page.waitForSelector('[data-test="title"]');

  await shPage.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await shPage.click('[data-test="shopping-cart-link"]');
  await shPage.click('[data-test="checkout"]');
  return shPage;
}

test.describe('Checkout', () => {
  test('completes a purchase with valid information', async ({ page }) => {
    const shPage = await loginAddItemAndGoToCheckout(page);

    await shPage.fill('[data-test="firstName"]', 'John');
    await shPage.fill('[data-test="lastName"]', 'Doe');
    await shPage.fill('[data-test="postalCode"]', '12345');
    await shPage.click('[data-test="continue"]');

    await expect(page.locator('[data-test="secondary-header"]')).toHaveText('Checkout: Overview');

    await shPage.click('[data-test="finish"]');

    await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
    await expect(page.locator('[data-test="complete-text"]')).toHaveText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    );
  });
});

test.describe('Checkout — self-healing', () => {
  test('heals a broken first-name field selector via its placeholder', async ({ page }) => {
    const shPage = await loginAddItemAndGoToCheckout(page);

    // this id does not exist — the engine has to recover using the "First Name" placeholder hint
    await shPage.fill('[data-test="wrong-first-name"]', 'Jane', { labelHint: 'First Name' });
    await shPage.fill('[data-test="lastName"]', 'Doe');
    await shPage.fill('[data-test="postalCode"]', '54321');
    await shPage.click('[data-test="continue"]');

    await expect(page.locator('[data-test="secondary-header"]')).toHaveText('Checkout: Overview');

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-first-name"]')
    ).toBe(true);
  });
});
