import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

export class AriaLabelStrategy implements SelectorStrategy {
  name = 'aria-label';
  priority = 2;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    // try to extract a label hint from the original selector
    // e.g. '[aria-label="Submit"]' -> "Submit"
    const ariaMatch = context.original.match(/aria-label[=\s"']+([^"'\]]+)/i);
    const hint = ariaMatch?.[1] ?? context.labelHint;

    if (!hint) return null;

    const variations = [hint, hint.toLowerCase(), hint.trim()];

    for (const variation of variations) {
      const locator = page
        .getByRole('button', { name: variation })
        .or(page.getByRole('link', { name: variation }))
        .or(page.getByLabel(variation));

      if ((await locator.count()) === 1) return locator;
    }

    return null;
  }
}
