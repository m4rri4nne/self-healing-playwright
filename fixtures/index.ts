import * as path from 'path';
import { test as base } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';
import { HEALING_TMP_DIR } from './paths';
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
  log: HealingLog;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  // one HealingLog per worker process, written to a private temp file.
  // fixtures/globalTeardown.ts merges every worker's file into a single
  // reports/healing-log.json once the whole run finishes.
  log: [
    async ({}, use, workerInfo) => {
      const log = new HealingLog(path.join(HEALING_TMP_DIR, `worker-${workerInfo.workerIndex}.json`));
      await use(log);
      log.save(/* quiet */ true);
    },
    { scope: 'worker' },
  ],

  shPage: async ({ page, log }, use, testInfo) => {
    log.setTestContext({
      testName: testInfo.titlePath.slice(1).join(' > '),
      specFile: path.relative(process.cwd(), testInfo.file).replace(/\\/g, '/'),
    });
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
