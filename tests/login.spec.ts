import { test, expect } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const BASE_URL = 'https://www.saucedemo.com/';
const VALID_USER = 'standard_user';
const VALID_PASSWORD = 'secret_sauce';

const log = new HealingLog('./reports/login-healing-log.json');
test.afterAll(() => log.save());

test.describe('Login', () => {
  test('logs in successfully with valid credentials', async ({ page }) => {
    const shPage = createSelfHealingPage(page, log);
    await page.goto(BASE_URL);

    await shPage.fill('[data-test="username"]', VALID_USER);
    await shPage.fill('[data-test="password"]', VALID_PASSWORD);
    await shPage.click('[data-test="login-button"]');

    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('shows an error message with invalid credentials', async ({ page }) => {
    const shPage = createSelfHealingPage(page, log);
    await page.goto(BASE_URL);

    await shPage.fill('[data-test="username"]', 'invalid_user');
    await shPage.fill('[data-test="password"]', 'wrong_password');
    await shPage.click('[data-test="login-button"]');

    await expect(page.locator('[data-test="error"]')).toContainText(
      'Epic sadface: Username and password do not match any user in this service'
    );
  });
});

test.describe('Login — self-healing', () => {
  test('heals a broken login button selector and still logs in', async ({ page }) => {
    const shPage = createSelfHealingPage(page, log);
    await page.goto(BASE_URL);

    await shPage.fill('[data-test="username"]', VALID_USER);
    await shPage.fill('[data-test="password"]', VALID_PASSWORD);

    // this id does not exist — the engine has to recover using the "Login" hint
    await shPage.click('[data-test="wrong-login-btn"]', { labelHint: 'Login' });

    await expect(page.locator('[data-test="title"]')).toHaveText('Products');

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-login-btn"]')
    ).toBe(true);
  });
});
