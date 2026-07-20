import { test, expect } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const log = new HealingLog();

test.afterAll(() => log.save());

test('login with self-healing', async ({ page }) => {
  // self-contained page standing in for a real app under test
  await page.setContent(`
    <form>
      <input id="email" type="email" />
      <input id="password" type="password" />
      <button id="submit-btn" type="button" aria-label="Login">Sign in</button>
    </form>
  `);

  const shPage = createSelfHealingPage(page, log);

  // in a real app, swap setContent above for page.goto('https://your-app/login')
  await shPage.fill('#email', 'user@email.com');
  await shPage.fill('#password', '123456');
  await shPage.click('#submit-btn', { labelHint: 'Login' });

  await expect(page.locator('#submit-btn')).toBeVisible();
});
