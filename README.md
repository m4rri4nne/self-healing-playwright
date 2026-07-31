# 🩹 Self-Healing Playwright

<p>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Playwright-1.45-2EAD33?logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/tests-self--healing-ff69b4" alt="Self-healing tests" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License: MIT" />
  <img src="https://img.shields.io/badge/made%20with-%E2%9C%A8%20%26%20%E2%98%95-orange" alt="Made with sparkle and coffee" />
</p>

> A wrapper around Playwright that, when a selector breaks, tries alternative location strategies before failing the test — and tracks how well it recovers over time. Think of it as a tiny safety net for your flaky selectors. 🕸️

## 💥 Problem

End-to-end tests break constantly not because the feature changed, but because a CSS selector or id changed along with the UI. Every markup tweak turns into manual test maintenance, even though the element the test cares about is still there — only its "address" moved.

## 🌱 Solution

`SelfHealingPage` replaces Playwright's regular `page.locator()`. When the original selector fails, `HealingEngine` tries a set of alternative location strategies, in order of reliability, before giving up. Every attempt — successful or not — is recorded by `HealingLog`.

```
SelfHealingPage
  └── tries the original selector
        └── fails? → HealingEngine
              ├── data-testid (fuzzy match)
              ├── aria-label
              ├── placeholder
              ├── alt text
              ├── role + name
              ├── visible text
              └── relative position
                    └── found? → save to HealingLog + continue
                    └── not found? → fail with a detailed report
```

## 🧠 Technical decisions

- **Strategy Pattern** (`SelectorStrategy`): each location technique (aria-label, text, role, etc.) implements the same interface. New strategies can be added without touching `HealingEngine`.
- **Priority order** — most to least reliable:

  | Priority | Strategy | Rationale |
  |---|---|---|
  | 1 | `data-testid` (fuzzy) | Semantic attribute, least volatile |
  | 2 | `aria-label` | Accessibility standard, stable |
  | 3 | `placeholder` | Stable for form inputs |
  | 4 | `alt text` | Stable for images |
  | 5 | `role + name` | Semantic, behavior-based |
  | 6 | Visible text | Works well for buttons and links |
  | 7 | Relative position | Last resort, brittle |

- **`count() === 1` as the acceptance rule**: if a strategy resolves to more than one element, the engine won't risk clicking the wrong one — it moves on to the next strategy instead.

## 📊 Results

A single `reports/healing-log.json`, combining every spec file and worker from the run, is (re)generated each time the suite runs:

```json
{
  "totalAttempts": 1,
  "healed": 1,
  "failed": 0,
  "healingRate": "100.0%",
  "entries": [
    {
      "testName": "should heal a broken selector via aria-label",
      "specFile": "tests/healing.spec.ts",
      "healed": true,
      "strategyUsed": "aria-label",
      "newSelector": "#wrong-submit-id",
      "originalSelector": "#wrong-submit-id",
      "timestamp": "2026-07-20T12:56:44.109Z"
    }
  ]
}
```

The framework recovered 100% of the intentional failures in this run 🎉 — the log is regenerated (and the rate recalculated) every time the suite runs. `testName` and `specFile` on each entry make it easy to group/pivot the file into a dashboard.

### How the combined log is produced

Playwright runs spec files across multiple worker processes, so results can't just be accumulated in one in-memory object. Instead:

1. Each worker gets its own `HealingLog` (the `log` fixture in [`fixtures/index.ts`](fixtures/index.ts)), writing to a private file under `reports/.healing-tmp/`.
2. [`fixtures/globalSetup.ts`](fixtures/globalSetup.ts) wipes that temp folder before the run starts, so a previous (or aborted) run never leaks in.
3. [`fixtures/globalTeardown.ts`](fixtures/globalTeardown.ts) runs once after every worker finishes, merges all the temp files into `reports/healing-log.json`, and deletes the temp folder.

## 🚀 Usage

```bash
npm install
npx playwright install chromium
npm test
```

```typescript
import { test, expect } from '../fixtures';

test('login with self-healing', async ({ page, loginPage }) => {
  await page.goto('https://example.com/login');
  await loginPage.login('user@email.com', '123456');

  await expect(page).toHaveURL('/dashboard');
});
```

`hint.labelHint` gives the strategies a starting point (e.g. the accessible name to look for) when the original selector carries no useful information to fall back on.

### Fixtures & Page Objects

[`fixtures/index.ts`](fixtures/index.ts) extends Playwright's `test` with:

- `shPage` — a `SelfHealingPage` wired to the worker's `HealingLog`, automatically tagging every entry with the current test name and spec file.
- `log` — the underlying worker-scoped `HealingLog`; see [How the combined log is produced](#how-the-combined-log-is-produced) for how per-worker logs become one report.
- One fixture per page object (`loginPage`, `homePage`, `cartPage`, `checkoutPage`, `demoLoginFormPage`, `demoButtonPage`), each pre-built with `page` and `shPage`.

Page objects live in [`pages/`](pages/) and expose selectors + actions through `shPage`, so any selector they use benefits from self-healing automatically.

## 🗂️ Project structure

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
│   │   ├── PlaceHolderStrategy.ts
│   │   ├── AltTextStrategy.ts
│   │   ├── RoleStrategy.ts
│   │   ├── TextContentStrategy.ts
│   │   └── RelativePositionStrategy.ts
│   └── types/
│       └── index.ts
├── pages/                           # Page Objects, actions go through shPage
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   ├── DemoLoginFormPage.ts
│   └── DemoButtonPage.ts
├── fixtures/
│   ├── index.ts                     # test.extend: log + page object fixtures
│   ├── paths.ts                     # shared temp-dir / report-path constants
│   ├── globalSetup.ts               # clears reports/.healing-tmp/ before the run
│   └── globalTeardown.ts            # merges per-worker logs into one report
├── tests/
│   ├── login.spec.ts
│   ├── home.spec.ts
│   ├── cart.spec.ts
│   ├── checkout.spec.ts
│   ├── example.spec.ts
│   └── healing.spec.ts              # tests for the framework itself
├── reports/
│   └── healing-log.json             # generated at runtime
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 🗺️ Roadmap

Future directions:

- **Healing persistence** — save `healing-log.json` and reuse previously healed selector mappings across runs
- **HTML snapshots** — capture the DOM around a failed element to feed an AI model that suggests the correct selector
- **Health dashboard** — a UI to visualize which selectors break most often

## 📜 License

MIT — use it, break it, heal it. 💛
