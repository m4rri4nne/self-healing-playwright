import { Page, Locator } from '@playwright/test';
import { SelfHealingPage } from '../src/core/SelfHealingPage';

// self-contained page standing in for a real app under test
export class DemoLoginFormPage {
  private readonly emailInput = '#email';
  private readonly passwordInput = '#password';
  private readonly submitButton = '#submit-btn';

  constructor(private readonly page: Page, private readonly shPage: SelfHealingPage) {}

  // in a real app, swap this for page.goto('https://your-app/login')
  async render() {
    await this.page.setContent(`
      <form>
        <input id="email" type="email" />
        <input id="password" type="password" />
        <button id="submit-btn" type="button" aria-label="Login">Sign in</button>
      </form>
    `);
  }

  async login(email: string, password: string) {
    await this.shPage.fill(this.emailInput, email);
    await this.shPage.fill(this.passwordInput, password);
    await this.shPage.click(this.submitButton, { labelHint: 'Login' });
  }

  get submitBtn(): Locator {
    return this.page.locator(this.submitButton);
  }
}
