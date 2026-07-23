import { test, expect, Page } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const BASE_URL = 'https://www.saucedemo.com/';

const log = new HealingLog('./reports/home-healing-log.json');
test.afterAll(() => log.save());

async function login(page: Page): Promise<SelfHealingPage> {
  const shPage = createSelfHealingPage(page, log);
  await page.goto(BASE_URL);
  await shPage.fill('[data-test="username"]', 'standard_user');
  await shPage.fill('[data-test="password"]', 'secret_sauce');
  await shPage.click('[data-test="login-button"]');
  await page.waitForSelector('[data-test="title"]');
  return shPage;
}

test.describe('Home / Inventory', () => {
  test('lists the products on the inventory page', async ({ page }) => {
    await login(page);

    const items = page.locator('[data-test="inventory-item"]');
    await expect(items).toHaveCount(6);

    for (const item of await items.all()) {
      await expect(item.locator('[data-test="inventory-item-name"]')).toBeVisible();
      await expect(item.locator('[data-test="inventory-item-desc"]')).toBeVisible();
      await expect(item.locator('[data-test="inventory-item-price"]')).toBeVisible();
    }
  });

  test('adds and removes an item from the cart', async ({ page }) => {
    const shPage = await login(page);

    await shPage.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await shPage.click('[data-test="remove-sauce-labs-backpack"]');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
    await expect(page.locator('[data-test="add-to-cart-sauce-labs-backpack"]')).toBeVisible();
  });

  test.describe('Sort products', () => {
    test('sorts by name A to Z', async ({ page }) => {
      await login(page);
      await page.selectOption('[data-test="product-sort-container"]', { label: 'Name (A to Z)' });

      const names = await page.locator('[data-test="inventory-item-name"]').allTextContents();
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    test('sorts by name Z to A', async ({ page }) => {
      await login(page);
      await page.selectOption('[data-test="product-sort-container"]', { label: 'Name (Z to A)' });

      const names = await page.locator('[data-test="inventory-item-name"]').allTextContents();
      expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    });

    test('sorts by price low to high', async ({ page }) => {
      await login(page);
      await page.selectOption('[data-test="product-sort-container"]', { label: 'Price (low to high)' });

      const prices = (await page.locator('[data-test="inventory-item-price"]').allTextContents())
        .map(p => parseFloat(p.replace('$', '')));
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    test('sorts by price high to low', async ({ page }) => {
      await login(page);
      await page.selectOption('[data-test="product-sort-container"]', { label: 'Price (high to low)' });

      const prices = (await page.locator('[data-test="inventory-item-price"]').allTextContents())
        .map(p => parseFloat(p.replace('$', '')));
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });
  });
});

test.describe('Home — self-healing', () => {
  test('heals a broken remove-from-cart selector', async ({ page }) => {
    const shPage = await login(page);

    await shPage.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    // this id does not exist — the engine has to recover using the "Remove" hint
    await shPage.click('[data-test="wrong-remove-btn"]', { labelHint: 'Remove' });

    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
    await expect(page.locator('[data-test="add-to-cart-sauce-labs-backpack"]')).toBeVisible();

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-remove-btn"]')
    ).toBe(true);
  });
});
