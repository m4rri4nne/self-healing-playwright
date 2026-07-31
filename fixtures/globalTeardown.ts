import * as fs from 'fs';
import * as path from 'path';
import { HealingLog } from '../src/core/HealingLog';
import { HealingResult } from '../src/types';
import { HEALING_TMP_DIR, HEALING_REPORT_JSON_PATH } from './paths';
import { generateHealingReport } from './generateHealingReport';
import { appendHealingHistory } from './appendHealingHistory';

// merges every worker's private log (written by the `log` fixture) into a
// single reports/healing-log.json covering the whole test run, then renders
// reports/healing-report.html from it
export default async function globalTeardown() {
  if (!fs.existsSync(HEALING_TMP_DIR)) return;

  const combined = new HealingLog(HEALING_REPORT_JSON_PATH);

  for (const file of fs.readdirSync(HEALING_TMP_DIR)) {
    if (!file.endsWith('.json')) continue;

    const { entries } = JSON.parse(
      fs.readFileSync(path.join(HEALING_TMP_DIR, file), 'utf-8')
    ) as { entries: HealingResult[] };

    entries.forEach(entry => combined.record(entry));
  }

  combined.save();
  fs.rmSync(HEALING_TMP_DIR, { recursive: true, force: true });
  appendHealingHistory(combined.getEntries());

  const reportPath = generateHealingReport();
  console.log(`[SelfHealing] HTML report saved to ${reportPath}`);
}
