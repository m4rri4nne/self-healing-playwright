import { test as base } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { DemoLoginFormPage } from '../pages/DemoLoginFormPage';
import { DemoButtonPage } from '../pages/DemoButtonPage';

type Fixtures = {
  shPage: SelfHealingPage;
  loginPage: LoginPage;
  homePage: HomePage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  demoLoginFormPage: DemoLoginFormPage;
  demoButtonPage: DemoButtonPage;
};

type WorkerFixtures = {
  logPath: string;
  log: HealingLog;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  // override per spec file with test.use({ logPath: '...' })
  logPath: ['./reports/healing-log.json', { option: true, scope: 'worker' }],

  // one HealingLog per spec file, saved once all its tests have run
  log: [
    async ({ logPath }, use) => {
      const log = new HealingLog(logPath);
      await use(log);
      log.save();
    },
    { scope: 'worker' },
  ],

  shPage: async ({ page, log }, use) => {
    await use(createSelfHealingPage(page, log));
  },

  loginPage: async ({ page, shPage }, use) => {
    await use(new LoginPage(page, shPage));
  },

  homePage: async ({ page, shPage }, use) => {
    await use(new HomePage(page, shPage));
  },

  cartPage: async ({ page, shPage }, use) => {
    await use(new CartPage(page, shPage));
  },

  checkoutPage: async ({ page, shPage }, use) => {
    await use(new CheckoutPage(page, shPage));
  },

  demoLoginFormPage: async ({ page, shPage }, use) => {
    await use(new DemoLoginFormPage(page, shPage));
  },

  demoButtonPage: async ({ page, shPage }, use) => {
    await use(new DemoButtonPage(page, shPage));
  },
});

export { expect } from '@playwright/test';
