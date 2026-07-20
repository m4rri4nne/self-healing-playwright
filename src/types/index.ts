import { Page, Locator } from '@playwright/test';

export interface SelectorStrategy {
  name: string;
  priority: number;
  locate(page: Page, context: SelectorContext): Promise<Locator | null>;
}

export interface SelectorContext {
  original: string;
  elementType?: string;
  labelHint?: string;
  snapshot?: string;
}

export interface HealingResult {
  healed: boolean;
  strategyUsed?: string;
  newSelector?: string;
  originalSelector: string;
  timestamp: string;
  testName?: string;
}
