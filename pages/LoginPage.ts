import { Page, Locator } from '@playwright/test';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { SelectorContext } from '../src/types';

export class LoginPage {
  static readonly URL = 'https://www.saucedemo.com/';

  private readonly usernameInput = '[data-test="username"]';
  private readonly passwordInput = '[data-test="password"]';
  private readonly loginButton = '[data-test="login-button"]';

  constructor(private readonly page: Page, private readonly shPage: SelfHealingPage) {}

  async goto() {
    await this.page.goto(LoginPage.URL);
  }

  async fillUsername(username: string) {
    await this.shPage.fill(this.usernameInput, username);
  }

  async fillPassword(password: string) {
    await this.shPage.fill(this.passwordInput, password);
  }

  async clickLoginButton(selector: string = this.loginButton, hint?: Partial<SelectorContext>) {
    await this.shPage.click(selector, hint);
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLoginButton();
  }

  get title(): Locator {
    return this.page.locator('[data-test="title"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-test="error"]');
  }
}
