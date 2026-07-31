import * as fs from 'fs';
import * as path from 'path';
import { HealingResult } from '../src/types';
import { HEALING_HISTORY_PATH } from './paths';

// unlike HealingLog.save() (which overwrites), this appends — history.json is the
// only place results survive past the run that produced them
export function appendHealingHistory(
  entries: HealingResult[],
  historyPath: string = HEALING_HISTORY_PATH
): void {
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const existing: HealingResult[] = fs.existsSync(historyPath)
    ? JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
    : [];

  fs.writeFileSync(historyPath, JSON.stringify([...existing, ...entries], null, 2));
}
