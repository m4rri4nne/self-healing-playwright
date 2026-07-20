import { test, expect } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const log = new HealingLog();

test.afterAll(() => log.save());

test('should heal a broken selector via aria-label', async ({ page }) => {
  await page.setContent(`<button aria-label="Submit Form">Send</button>`);

  const shPage = createSelfHealingPage(page, log);

  // "wrong" selector — this id does not exist on the page
  const locator = await shPage.locate('#wrong-submit-id', {
    labelHint: 'Submit Form',
  });

  await expect(locator).toBeVisible();
});

test('should record the healing outcome in the log', async () => {
  const entries = log.getEntries();
  expect(entries.some(e => e.healed)).toBe(true);
  expect(entries.some(e => e.strategyUsed === 'aria-label')).toBe(true);
});
