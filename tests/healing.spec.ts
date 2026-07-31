import { test, expect } from '../fixtures';

test('should heal a broken selector via aria-label', async ({ demoButtonPage }) => {
  await demoButtonPage.render();

  const locator = await demoButtonPage.locateSubmitButton();

  await expect(locator).toBeVisible();
});

test('should record the healing outcome in the log', async ({ log }) => {
  const entries = log.getEntries();
  expect(entries.some(e => e.healed)).toBe(true);
  expect(entries.some(e => e.strategyUsed === 'aria-label')).toBe(true);
});
