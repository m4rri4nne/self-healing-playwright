import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

const VALID_USER = 'standard_user';
const VALID_PASSWORD = 'secret_sauce';

async function loginAndAddItem(loginPage: LoginPage, homePage: HomePage) {
  await loginPage.goto();
  await loginPage.login(VALID_USER, VALID_PASSWORD);
  await homePage.waitUntilLoaded();

  await homePage.addBackpackToCart();
  await homePage.goToCart();
}

test.describe('Your Cart', () => {
  test('lists the added item and allows navigating to checkout', async ({ loginPage, homePage, cartPage, checkoutPage }) => {
    await loginAndAddItem(loginPage, homePage);

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.itemNames).toHaveText('Sauce Labs Backpack');

    await cartPage.goToCheckout();
    await expect(checkoutPage.firstNameField).toBeVisible();
  });

  test('removes the item from the cart', async ({ loginPage, homePage, cartPage }) => {
    await loginAndAddItem(loginPage, homePage);

    await cartPage.removeBackpack();
    await expect(cartPage.items).toHaveCount(0);
  });
});

test.describe('Your Cart — self-healing', () => {
  test('heals a broken checkout button selector', async ({ loginPage, homePage, cartPage, checkoutPage, log }) => {
    await loginAndAddItem(loginPage, homePage);

    // this id does not exist — the engine has to recover using the "Checkout" hint
    await cartPage.goToCheckout('[data-test="wrong-checkout-btn"]', { labelHint: 'Checkout' });

    await expect(checkoutPage.firstNameField).toBeVisible();

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-checkout-btn"]')
    ).toBe(true);
  });
});
