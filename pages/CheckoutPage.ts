import { Page, Locator } from '@playwright/test';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { SelectorContext } from '../src/types';

export class CheckoutPage {
  private readonly firstNameInput = '[data-test="firstName"]';
  private readonly lastNameInput = '[data-test="lastName"]';
  private readonly postalCodeInput = '[data-test="postalCode"]';
  private readonly continueButton = '[data-test="continue"]';
  private readonly finishButton = '[data-test="finish"]';

  constructor(private readonly page: Page, private readonly shPage: SelfHealingPage) {}

  async fillFirstName(value: string, selector: string = this.firstNameInput, hint?: Partial<SelectorContext>) {
    await this.shPage.fill(selector, value, hint);
  }

  async fillLastName(value: string) {
    await this.shPage.fill(this.lastNameInput, value);
  }

  async fillPostalCode(value: string) {
    await this.shPage.fill(this.postalCodeInput, value);
  }

  async continueToOverview() {
    await this.shPage.click(this.continueButton);
  }

  async finish() {
    await this.shPage.click(this.finishButton);
  }

  async fillInformation(firstName: string, lastName: string, postalCode: string) {
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.fillPostalCode(postalCode);
    await this.continueToOverview();
  }

  get firstNameField(): Locator {
    return this.page.locator(this.firstNameInput);
  }

  get secondaryHeader(): Locator {
    return this.page.locator('[data-test="secondary-header"]');
  }

  get completeHeader(): Locator {
    return this.page.locator('[data-test="complete-header"]');
  }

  get completeText(): Locator {
    return this.page.locator('[data-test="complete-text"]');
  }
}
