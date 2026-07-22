import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

// last resort — fragile, but useful when nothing else identifies the element
// on its own: find the type of node we expect right after a known label.
export class RelativePositionStrategy implements SelectorStrategy {
  name = 'relative-position';
  priority = 7;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    const hint = context.labelHint;
    if (!hint) return null;

    const elementType = context.elementType ?? '*';

    const locator = page
      .getByText(hint, { exact: false })
      .locator(`xpath=following::${elementType}[1]`);

    return (await locator.count()) === 1 ? locator : null;
  }
}
