import { test, expect } from '../fixtures';

const VALID_USER = 'standard_user';
const VALID_PASSWORD = 'secret_sauce';

test.use({ logPath: './reports/login-healing-log.json' });

test.describe('Login', () => {
  test('logs in successfully with valid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(VALID_USER, VALID_PASSWORD);

    await expect(loginPage.title).toHaveText('Products');
  });

  test('shows an error message with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid_user', 'wrong_password');

    await expect(loginPage.errorMessage).toContainText(
      'Epic sadface: Username and password do not match any user in this service'
    );
  });
});

test.describe('Login — self-healing', () => {
  test('heals a broken login button selector and still logs in', async ({ loginPage, log }) => {
    await loginPage.goto();
    await loginPage.fillUsername(VALID_USER);
    await loginPage.fillPassword(VALID_PASSWORD);

    // this id does not exist — the engine has to recover using the "Login" hint
    await loginPage.clickLoginButton('[data-test="wrong-login-btn"]', { labelHint: 'Login' });

    await expect(loginPage.title).toHaveText('Products');

    const entries = log.getEntries();
    expect(
      entries.some(e => e.healed && e.originalSelector === '[data-test="wrong-login-btn"]')
    ).toBe(true);
  });
});
