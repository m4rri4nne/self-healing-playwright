import { Page, Locator } from '@playwright/test';
import { SelectorStrategy, SelectorContext } from '../types';

type Role = Parameters<Page['getByRole']>[0];

const COMMON_ROLES: Role[] = [
  'button',
  'link',
  'textbox',
  'checkbox',
  'radio',
  'combobox',
  'menuitem',
  'tab',
];

export class RoleStrategy implements SelectorStrategy {
  name = 'role';
  priority = 5;

  async locate(page: Page, context: SelectorContext): Promise<Locator | null> {
    const name = context.labelHint ?? this.extractHint(context.original);
    if (!name) return null;

    for (const role of COMMON_ROLES) {
      const locator = page.getByRole(role, { name });
      if ((await locator.count()) === 1) return locator;
    }

    return null;
  }

  private extractHint(selector: string): string | undefined {
    const match = selector.match(/(?:name|aria-label|text)[=\s"']+([^"'\]]+)/i);
    return match?.[1];
  }
}
