import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

const VALID_USER = 'standard_user';
const VALID_PASSWORD = 'secret_sauce';

test.use({ logPath: './reports/checkout-healing-log.json' });

async function loginAddItemAndGoToCheckout(loginPage: LoginPage, homePage: HomePage, cartPage: CartPage) {
  await loginPage.goto();
  await loginPage.login(VALID_USER, VALID_PASSWORD);
  await homePage.waitUntilLoaded();

  await homePage.addBackpackToCart();
  await homePage.goToCart();
  await cartPage.goToCheckout();
}

test.describe('Checkout', () => {
  test('completes a purchase with valid information', async ({ loginPage, homePage, cartPage, checkoutPage }) => {
    await loginAddItemAndGoToCheckout(loginPage, homePage, cartPage);

    await checkoutPage.fillInformation('John', 'Doe', '12345');

    await expect(checkoutPage.secondaryHeader).toHaveText('Checkout: Overview');

    await checkoutPage.finish();

    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeText).toHaveText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    );
  });
});

test.describe('Checkout — self-healing', () => {
  test('heals a broken first-name field selector via its placeholder', async ({
    loginPage,
    homePage,
    cartPage,
    checkoutPage,
    log,
  }) => {
    await loginAddItemAndGoToCheckout(loginPage, homePage, cartPage);

    // this id does not exist — the engine has to recover using the "First Name" placeholder hint
    await checkoutPage.fillFirstName('Jane', '[data-test="wrong-first-name"]', { labelHint: 'First Name' });
    await checkoutPage.fillLastName('Doe');
    await checkoutPage.fillPostalCode('54321');
    await checkoutPage.continueToOverview();

    await expect(checkoutPage.secondaryHeader).toHaveText('Checkout: Overview');

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-first-name"]')
    ).toBe(true);
  });
});
