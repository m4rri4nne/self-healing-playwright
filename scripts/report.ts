import { generateHealingReport } from '../fixtures/generateHealingReport';

const reportPath = generateHealingReport();
console.log(`[SelfHealing] HTML report saved to ${reportPath}`);
