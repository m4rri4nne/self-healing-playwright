import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

export class AltTextStrategy implements SelectorStrategy {
  name = 'alt-text';
  priority = 4;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    const altMatch = context.original.match(/alt[=\s"']+([^"'\]]+)/i);
    const hint = altMatch?.[1] ?? context.labelHint;

    if (!hint) return null;

    const variations = [hint, hint.toLowerCase(), hint.trim()];

    for (const variation of variations) {
      const locator = page.getByAltText(variation, { exact: false });
      if ((await locator.count()) === 1) return locator;
    }

    return null;
  }
}
