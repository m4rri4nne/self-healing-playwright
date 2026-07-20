import { Page, Locator } from '@playwright/test';
import { HealingEngine } from './HealingEngine';
import { HealingLog } from './HealingLog';
import { SelectorContext } from '../types';

export class SelfHealingPage {
  constructor(
    private page: Page,
    private engine: HealingEngine,
    private log: HealingLog
  ) {}

  // main entry point — replaces page.locator()
  async locate(selector: string, hint?: Partial<SelectorContext>): Promise<Locator> {
    const locator = this.page.locator(selector);

    try {
      await locator.waitFor({ timeout: 3000 });
      return locator;
    } catch {
      console.warn(`[SelfHealing] Selector failed: "${selector}". Trying alternative strategies...`);

      const context: SelectorContext = {
        original: selector,
        ...hint,
      };

      const healed = await this.engine.heal(this.page, context);

      if (healed) {
        console.log(`[SelfHealing] Healed with strategy: ${healed.result.strategyUsed}`);
        this.log.record(healed.result);
        return healed.locator;
      }

      this.log.record({
        healed: false,
        originalSelector: selector,
        timestamp: new Date().toISOString(),
      });

      throw new Error(
        `[SelfHealing] Could not locate "${selector}" with any strategy.\n` +
        `Strategies tried: ${this.engine.strategiesUsed.join(', ')}`
      );
    }
  }

  async click(selector: string, hint?: Partial<SelectorContext>) {
    const locator = await this.locate(selector, hint);
    await locator.click();
  }

  async fill(selector: string, value: string, hint?: Partial<SelectorContext>) {
    const locator = await this.locate(selector, hint);
    await locator.fill(value);
  }

  // escape hatch to the underlying Playwright page when needed
  get native(): Page {
    return this.page;
  }
}
