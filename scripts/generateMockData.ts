import * as fs from 'fs';
import { HealingLog } from '../src/core/HealingLog';
import { HealingResult } from '../src/types';
import { HEALING_REPORT_JSON_PATH, HEALING_HISTORY_PATH } from '../fixtures/paths';
import { generateHealingReport } from '../fixtures/generateHealingReport';

// deterministic PRNG (mulberry32) so re-runs produce the same "random" spread
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260731);
const chance = (probability: number) => random() < probability;

// weighted so data-testid/aria-label (highest-priority strategies) win most often, mirroring HealingEngine's priority order
const STRATEGY_WEIGHTS: [string, number][] = [
  ['data-testid', 10],
  ['aria-label', 8],
  ['placeholder', 5],
  ['alt-text', 3],
  ['role', 2],
  ['text-content', 1],
  ['relative-position', 1],
];
function weightedStrategy(): string {
  const total = STRATEGY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [name, weight] of STRATEGY_WEIGHTS) {
    if (roll < weight) return name;
    roll -= weight;
  }
  return STRATEGY_WEIGHTS[0][0];
}

interface Scenario {
  specFile: string;
  testName: string;
  selector: string;
  weight: number; // how many times this selector tends to break — some selectors are chronic offenders
}

// a broad spread across every spec file, with a handful of "chronic offender" selectors
// that break far more often than the rest — the exact story the report should surface
const SCENARIOS: Scenario[] = [
  { specFile: 'tests/login.spec.ts', testName: 'Login — self-healing > heals a broken login button selector and still logs in', selector: '[data-test="wrong-login-btn"]', weight: 6 },
  { specFile: 'tests/login.spec.ts', testName: 'Login — self-healing > heals a broken username field selector', selector: '[data-test="wrong-username-field"]', weight: 2 },

  { specFile: 'tests/home.spec.ts', testName: 'Home — self-healing > heals a broken remove-from-cart selector', selector: '[data-test="wrong-remove-btn"]', weight: 5 },
  { specFile: 'tests/home.spec.ts', testName: 'Home / Inventory > adds and removes an item from the cart', selector: '[data-test="wrong-add-to-cart-btn"]', weight: 4 },
  { specFile: 'tests/home.spec.ts', testName: 'Home / Inventory > Sort products > sorts by price low to high', selector: '[data-test="wrong-sort-dropdown"]', weight: 2 },
  { specFile: 'tests/home.spec.ts', testName: 'Home / Inventory > lists the products on the inventory page', selector: '.old-inventory-item', weight: 1 },

  { specFile: 'tests/cart.spec.ts', testName: 'Your Cart — self-healing > heals a broken checkout button selector', selector: '[data-test="wrong-checkout-btn"]', weight: 5 },
  { specFile: 'tests/cart.spec.ts', testName: 'Your Cart > removes the item from the cart', selector: '[data-test="wrong-remove-sauce-labs-backpack"]', weight: 3 },
  { specFile: 'tests/cart.spec.ts', testName: 'Your Cart > lists the added item and allows navigating to checkout', selector: '#legacy-cart-icon', weight: 1 },

  { specFile: 'tests/checkout.spec.ts', testName: 'Checkout — self-healing > heals a broken first-name field selector via its placeholder', selector: '[data-test="wrong-first-name"]', weight: 4 },
  { specFile: 'tests/checkout.spec.ts', testName: 'Checkout > completes a purchase with valid information', selector: '[data-test="wrong-continue-btn"]', weight: 3 },
  { specFile: 'tests/checkout.spec.ts', testName: 'Checkout > completes a purchase with valid information', selector: '[data-test="wrong-finish-btn"]', weight: 2 },
  { specFile: 'tests/checkout.spec.ts', testName: 'Checkout — self-healing > heals a broken postal code field selector', selector: '[data-test="wrong-postal-code"]', weight: 1 },

  { specFile: 'tests/healing.spec.ts', testName: 'should heal a broken selector via aria-label', selector: '#wrong-submit-id', weight: 3 },
  { specFile: 'tests/healing.spec.ts', testName: 'should heal a broken selector via alt text', selector: '#wrong-logo-img', weight: 1 },

  { specFile: 'tests/example.spec.ts', testName: 'login with self-healing', selector: '#submit-btn-old', weight: 2 },
];

// entries are spread across this many months of synthetic history, so the trend
// chart has more than one point to draw a line through
const MONTHS_OF_HISTORY = 6;
// each scenario's weight is multiplied by this to get a believable volume per month
const ENTRIES_PER_WEIGHT = 3;
// simulates a maturing suite: selectors were harder to heal further in the past,
// and the team's strategies/coverage have improved since — so the trend line
// should read as "getting better over time", the story this chart exists to tell
const OLDEST_MONTH_UNHEALED_RATE = 0.32;
const NEWEST_MONTH_UNHEALED_RATE = 0.04;

function randomMonthsAgo(): number {
  return random() * MONTHS_OF_HISTORY;
}

function timestampFromMonthsAgo(monthsAgo: number): string {
  const msPerMonth = 30 * 24 * 60 * 60 * 1000;
  const jitterMs = random() * msPerMonth * 0.9;
  return new Date(Date.now() - monthsAgo * msPerMonth - jitterMs).toISOString();
}

function unhealedRateFor(monthsAgo: number): number {
  const t = Math.min(monthsAgo / MONTHS_OF_HISTORY, 1);
  return NEWEST_MONTH_UNHEALED_RATE + (OLDEST_MONTH_UNHEALED_RATE - NEWEST_MONTH_UNHEALED_RATE) * t;
}

function buildEntries(): HealingResult[] {
  const entries: HealingResult[] = [];

  for (const scenario of SCENARIOS) {
    for (let i = 0; i < scenario.weight * ENTRIES_PER_WEIGHT; i++) {
      const monthsAgo = randomMonthsAgo();
      const healed = !chance(unhealedRateFor(monthsAgo));
      entries.push({
        healed,
        strategyUsed: healed ? weightedStrategy() : undefined,
        newSelector: healed ? scenario.selector : undefined,
        originalSelector: scenario.selector,
        timestamp: timestampFromMonthsAgo(monthsAgo),
        testName: scenario.testName,
        specFile: scenario.specFile,
      });
    }
  }

  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function main() {
  const allEntries = buildEntries();

  // the whole 6-month spread becomes "history" (what the trend chart reads)...
  fs.writeFileSync(HEALING_HISTORY_PATH, JSON.stringify(allEntries, null, 2));

  // ...while healing-log.json — like a real run — reflects only the latest month,
  // mirroring how a single `npm test` run only ever produces same-day entries
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const latestRunEntries = allEntries.filter(e => e.timestamp.slice(0, 7) === currentMonthKey);

  const log = new HealingLog(HEALING_REPORT_JSON_PATH);
  latestRunEntries.forEach(entry => log.record(entry));
  log.save();

  const reportPath = generateHealingReport();
  console.log(`[SelfHealing] Mock HTML report saved to ${reportPath}`);
}

main();
