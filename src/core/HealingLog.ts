import * as fs from 'fs';
import * as path from 'path';
import { HealingResult } from '../types';

export class HealingLog {
  private entries: HealingResult[] = [];
  private outputPath: string;

  constructor(outputPath = './reports/healing-log.json') {
    this.outputPath = outputPath;
  }

  record(result: HealingResult) {
    this.entries.push(result);
  }

  getEntries(): HealingResult[] {
    return this.entries;
  }

  save() {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const healed = this.entries.filter(e => e.healed).length;
    const summary = {
      totalAttempts: this.entries.length,
      healed,
      failed: this.entries.length - healed,
      healingRate: this.entries.length > 0
        ? `${((healed / this.entries.length) * 100).toFixed(1)}%`
        : '0.0%',
      entries: this.entries,
    };

    fs.writeFileSync(this.outputPath, JSON.stringify(summary, null, 2));
    console.log(`\n[SelfHealing] Report saved to ${this.outputPath}`);
    console.log(`[SelfHealing] Healing rate: ${summary.healingRate} (${summary.healed}/${summary.totalAttempts})`);
  }
}
