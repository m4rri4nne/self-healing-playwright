import { test, expect } from '../fixtures';

test('login with self-healing', async ({ demoLoginFormPage }) => {
  await demoLoginFormPage.render();

  await demoLoginFormPage.login('user@email.com', '123456');

  await expect(demoLoginFormPage.submitBtn).toBeVisible();
});
