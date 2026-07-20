import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

const normalize = (value: string) => value.toLowerCase().replace(/[-_\s]/g, '');

export class DataTestIdStrategy implements SelectorStrategy {
  name = 'data-testid';
  priority = 1;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    const match = context.original.match(/data-testid[=\s"']+([^"'\]]+)/i);
    const hint = match?.[1] ?? context.labelHint;

    if (!hint) return null;

    const normalizedHint = normalize(hint);
    const candidates = page.locator('[data-testid]');
    const count = await candidates.count();

    const matches: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const candidate = candidates.nth(i);
      const testId = await candidate.getAttribute('data-testid');
      if (!testId) continue;

      const normalizedTestId = normalize(testId);
      if (normalizedTestId === normalizedHint || normalizedTestId.includes(normalizedHint)) {
        matches.push(candidate);
      }
    }

    return matches.length === 1 ? matches[0] : null;
  }
}
