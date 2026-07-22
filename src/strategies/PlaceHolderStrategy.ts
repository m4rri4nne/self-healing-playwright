import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

export class PlaceHolderStrategy implements SelectorStrategy {
  name = 'placeholder';
  priority = 3;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    const placeholderMatch = context.original.match(/placeholder[=\s"']+([^"'\]]+)/i);
    const hint = placeholderMatch?.[1] ?? context.labelHint;

    if (!hint) return null;

    const variations = [hint, hint.toLowerCase(), hint.trim()];

    for (const variation of variations) {
      const locator = page.getByPlaceholder(variation, { exact: false });
      if ((await locator.count()) === 1) return locator;
    }

    return null;
  }
}
