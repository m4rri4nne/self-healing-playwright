import { Page, Locator } from '@playwright/test';
import { SelfHealingPage } from '../src/core/SelfHealingPage';
import { SelectorContext } from '../src/types';

export class HomePage {
  private readonly titleLocator = '[data-test="title"]';
  private readonly addBackpackButton = '[data-test="add-to-cart-sauce-labs-backpack"]';
  private readonly removeBackpackButton = '[data-test="remove-sauce-labs-backpack"]';
  private readonly cartLink = '[data-test="shopping-cart-link"]';
  private readonly sortContainer = '[data-test="product-sort-container"]';

  constructor(private readonly page: Page, private readonly shPage: SelfHealingPage) {}

  async waitUntilLoaded() {
    await this.page.waitForSelector(this.titleLocator);
  }

  async addBackpackToCart() {
    await this.shPage.click(this.addBackpackButton);
  }

  async removeBackpackFromCart(selector: string = this.removeBackpackButton, hint?: Partial<SelectorContext>) {
    await this.shPage.click(selector, hint);
  }

  async goToCart() {
    await this.shPage.click(this.cartLink);
  }

  async sortBy(label: string) {
    await this.page.selectOption(this.sortContainer, { label });
  }

  get items(): Locator {
    return this.page.locator('[data-test="inventory-item"]');
  }

  get itemNames(): Locator {
    return this.page.locator('[data-test="inventory-item-name"]');
  }

  get itemDescriptions(): Locator {
    return this.page.locator('[data-test="inventory-item-desc"]');
  }

  get itemPrices(): Locator {
    return this.page.locator('[data-test="inventory-item-price"]');
  }

  get addBackpackButtonLocator(): Locator {
    return this.page.locator(this.addBackpackButton);
  }

  get cartBadge(): Locator {
    return this.page.locator('[data-test="shopping-cart-badge"]');
  }

  async itemNameTexts(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async itemPriceValues(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map(p => parseFloat(p.replace('$', '')));
  }
}
