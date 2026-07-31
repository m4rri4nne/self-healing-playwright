import { Page, Locator } from '@playwright/test';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { SelectorContext } from '../src/types';

export class CartPage {
  private readonly removeBackpackButton = '[data-test="remove-sauce-labs-backpack"]';
  private readonly checkoutButton = '[data-test="checkout"]';

  constructor(private readonly page: Page, private readonly shPage: SelfHealingPage) {}

  async removeBackpack(selector: string = this.removeBackpackButton, hint?: Partial<SelectorContext>) {
    await this.shPage.click(selector, hint);
  }

  async goToCheckout(selector: string = this.checkoutButton, hint?: Partial<SelectorContext>) {
    await this.shPage.click(selector, hint);
  }

  get items(): Locator {
    return this.page.locator('[data-test="inventory-item"]');
  }

  get itemNames(): Locator {
    return this.page.locator('[data-test="inventory-item-name"]');
  }
}
