import * as path from 'path';

export const HEALING_TMP_DIR = path.resolve(__dirname, '../reports/.healing-tmp');
export const HEALING_REPORT_JSON_PATH = path.resolve(__dirname, '../reports/healing-log.json');
export const HEALING_REPORT_HTML_PATH = path.resolve(__dirname, '../reports/healing-report.html');
// accumulates entries across every run (unlike healing-log.json, which is overwritten each run)
// so the report can chart a trend over time
export const HEALING_HISTORY_PATH = path.resolve(__dirname, '../reports/healing-history.json');
