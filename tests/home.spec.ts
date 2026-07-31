import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

const VALID_USER = 'standard_user';
const VALID_PASSWORD = 'secret_sauce';

test.use({ logPath: './reports/home-healing-log.json' });

async function login(loginPage: LoginPage, homePage: HomePage) {
  await loginPage.goto();
  await loginPage.login(VALID_USER, VALID_PASSWORD);
  await homePage.waitUntilLoaded();
}

test.describe('Home / Inventory', () => {
  test('lists the products on the inventory page', async ({ loginPage, homePage }) => {
    await login(loginPage, homePage);

    await expect(homePage.items).toHaveCount(6);

    for (const item of await homePage.items.all()) {
      await expect(item.locator('[data-test="inventory-item-name"]')).toBeVisible();
      await expect(item.locator('[data-test="inventory-item-desc"]')).toBeVisible();
      await expect(item.locator('[data-test="inventory-item-price"]')).toBeVisible();
    }
  });

  test('adds and removes an item from the cart', async ({ loginPage, homePage }) => {
    await login(loginPage, homePage);

    await homePage.addBackpackToCart();
    await expect(homePage.cartBadge).toHaveText('1');

    await homePage.removeBackpackFromCart();
    await expect(homePage.cartBadge).toHaveCount(0);
    await expect(homePage.addBackpackButtonLocator).toBeVisible();
  });

  test.describe('Sort products', () => {
    test('sorts by name A to Z', async ({ loginPage, homePage }) => {
      await login(loginPage, homePage);
      await homePage.sortBy('Name (A to Z)');

      const names = await homePage.itemNameTexts();
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    test('sorts by name Z to A', async ({ loginPage, homePage }) => {
      await login(loginPage, homePage);
      await homePage.sortBy('Name (Z to A)');

      const names = await homePage.itemNameTexts();
      expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    });

    test('sorts by price low to high', async ({ loginPage, homePage }) => {
      await login(loginPage, homePage);
      await homePage.sortBy('Price (low to high)');

      const prices = await homePage.itemPriceValues();
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    test('sorts by price high to low', async ({ loginPage, homePage }) => {
      await login(loginPage, homePage);
      await homePage.sortBy('Price (high to low)');

      const prices = await homePage.itemPriceValues();
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });
  });
});

test.describe('Home — self-healing', () => {
  test('heals a broken remove-from-cart selector', async ({ loginPage, homePage, log }) => {
    await login(loginPage, homePage);

    await homePage.addBackpackToCart();
    await expect(homePage.cartBadge).toHaveText('1');

    // this id does not exist — the engine has to recover using the "Remove" hint
    await homePage.removeBackpackFromCart('[data-test="wrong-remove-btn"]', { labelHint: 'Remove' });

    await expect(homePage.cartBadge).toHaveCount(0);
    await expect(homePage.addBackpackButtonLocator).toBeVisible();

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-remove-btn"]')
    ).toBe(true);
  });
});
