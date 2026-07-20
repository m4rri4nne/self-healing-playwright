import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

export class TextContentStrategy implements SelectorStrategy {
  name = 'text-content';
  priority = 4;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    const textMatch = context.original.match(/text[=\s"']+([^"'\]]+)/i);
    const text = textMatch?.[1] ?? context.labelHint;

    if (!text) return null;

    const locator = page.getByText(text, { exact: false });
    return (await locator.count()) === 1 ? locator : null;
  }
}
