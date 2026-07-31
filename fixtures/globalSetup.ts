import * as fs from 'fs';
import { HEALING_TMP_DIR } from './paths';

// each run starts from a clean slate so leftovers from a previous
// (possibly aborted) run never leak into the combined report
export default async function globalSetup() {
  fs.rmSync(HEALING_TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(HEALING_TMP_DIR, { recursive: true });
}
