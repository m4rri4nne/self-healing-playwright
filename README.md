# Self-Healing Playwright

> A wrapper around Playwright that, when a selector breaks, tries alternative location strategies before failing the test — and tracks how well it recovers over time.

## Problem

End-to-end tests break constantly not because the feature changed, but because a CSS selector or id changed along with the UI. Every markup tweak turns into manual test maintenance, even though the element the test cares about is still there — only its "address" moved.

## Solution

`SelfHealingPage` replaces Playwright's regular `page.locator()`. When the original selector fails, `HealingEngine` tries a set of alternative location strategies, in order of reliability, before giving up. Every attempt — successful or not — is recorded by `HealingLog`.

```
SelfHealingPage
  └── tries the original selector
        └── fails? → HealingEngine
              ├── data-testid (fuzzy match)
              ├── aria-label
              ├── role + name
              ├── visible text
              └── relative position
                    └── found? → save to HealingLog + continue
                    └── not found? → fail with a detailed report
```

## Technical decisions

- **Strategy Pattern** (`SelectorStrategy`): each location technique (aria-label, text, role, etc.) implements the same interface. New strategies can be added without touching `HealingEngine`.
- **Priority order** — most to least reliable:

  | Priority | Strategy | Rationale |
  |---|---|---|
  | 1 | `data-testid` (fuzzy) | Semantic attribute, least volatile |
  | 2 | `aria-label` | Accessibility standard, stable |
  | 3 | `role + name` | Semantic, behavior-based |
  | 4 | Visible text | Works well for buttons and links |
  | 5 | Relative position | Last resort, brittle |

- **`count() === 1` as the acceptance rule**: if a strategy resolves to more than one element, the engine won't risk clicking the wrong one — it moves on to the next strategy instead.

## Results

Sample `reports/healing-log.json`, generated after running the test suite against an intentionally broken selector (`tests/healing.spec.ts`):

```json
{
  "totalAttempts": 1,
  "healed": 1,
  "failed": 0,
  "healingRate": "100.0%",
  "entries": [
    {
      "healed": true,
      "strategyUsed": "aria-label",
      "newSelector": "#wrong-submit-id",
      "originalSelector": "#wrong-submit-id",
      "timestamp": "2026-07-20T12:56:44.109Z"
    }
  ]
}
```

The framework recovered 100% of the intentional failures in this run — the log is regenerated (and the rate recalculated) every time the suite runs.

## Usage

```bash
npm install
npx playwright install chromium
npm test
```

```typescript
import { test, expect } from '@playwright/test';
import { createSelfHealingPage } from '../src/core/createSelfHealingPage';
import { HealingLog } from '../src/core/HealingLog';

const log = new HealingLog();
test.afterAll(() => log.save());

test('login with self-healing', async ({ page }) => {
  const shPage = createSelfHealingPage(page, log);

  await page.goto('https://example.com/login');
  await shPage.fill('#email', 'user@email.com');
  await shPage.fill('#password', '123456');
  await shPage.click('#submit-btn', { labelHint: 'Login' });

  await expect(page).toHaveURL('/dashboard');
});
```

`hint.labelHint` gives the strategies a starting point (e.g. the accessible name to look for) when the original selector carries no useful information to fall back on.

## Project structure

```
self-healing-playwright/
├── src/
│   ├── core/
│   │   ├── SelfHealingPage.ts       # main wrapper
│   │   ├── HealingEngine.ts         # strategy orchestration
│   │   ├── HealingLog.ts            # healing record & report
│   │   └── createSelfHealingPage.ts # integration factory
│   ├── strategies/
│   │   ├── DataTestIdStrategy.ts
│   │   ├── AriaLabelStrategy.ts
│   │   ├── RoleStrategy.ts
│   │   ├── TextContentStrategy.ts
│   │   └── RelativePositionStrategy.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── example.spec.ts
│   └── healing.spec.ts              # tests for the framework itself
├── reports/
│   └── healing-log.json             # generated at runtime
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Roadmap

Future directions:

- **Healing persistence** — save `healing-log.json` and reuse previously healed selector mappings across runs
- **HTML snapshots** — capture the DOM around a failed element to feed an AI model that suggests the correct selector
- **Playwright fixture** — package this as a reusable `test.extend` fixture for any Playwright project
- **Health dashboard** — a UI to visualize which selectors break most often

## License

MIT
