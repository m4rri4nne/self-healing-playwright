import { Page, Locator } from '@playwright/test';
import { SelectorContext, SelectorStrategy, HealingResult } from '../types';

export class HealingEngine {
  private strategies: SelectorStrategy[];

  constructor(strategies: SelectorStrategy[]) {
    // sort by priority — most reliable strategies first
    this.strategies = [...strategies].sort((a, b) => a.priority - b.priority);
  }

  get strategiesUsed(): string[] {
    return this.strategies.map(s => s.name);
  }

  async heal(page: Page, context: SelectorContext): Promise<{
    locator: Locator;
    result: HealingResult;
  } | null> {
    for (const strategy of this.strategies) {
      try {
        const locator = await strategy.locate(page, context);
        // a strategy that resolves to more than one element is unreliable —
        // we'd rather move on than click the wrong one
        if (locator && (await locator.count()) === 1) {
          return {
            locator,
            result: {
              healed: true,
              strategyUsed: strategy.name,
              newSelector: context.original,
              originalSelector: context.original,
              timestamp: new Date().toISOString(),
            },
          };
        }
      } catch {
        continue;
      }
    }
    return null;
  }
}
