import * as fs from 'fs';
import * as path from 'path';
import { HealingResult } from '../src/types';
import { HEALING_REPORT_JSON_PATH, HEALING_REPORT_HTML_PATH } from './paths';

interface HealingReportData {
  totalAttempts: number;
  healed: number;
  failed: number;
  healingRate: string;
  entries: HealingResult[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countBy<T>(items: T[], keyFn: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// horizontal bar chart: sequential single hue, 4px rounded data-end, value at the tip,
// with a table-view toggle (the accessibility twin of every chart)
function renderBarChart(title: string, data: [string, number][], id: string): string {
  const max = Math.max(1, ...data.map(([, value]) => value));

  const rows = data
    .map(([label, value]) => {
      const pct = ((value / max) * 100).toFixed(1);
      return `
        <div class="bar-row">
          <span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%" title="${escapeHtml(label)}: ${value}"></div>
          </div>
          <span class="bar-value">${value}</span>
        </div>`;
    })
    .join('');

  const tableRows = data
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${value}</td></tr>`)
    .join('');

  return `
  <figure class="card" id="${id}">
    <figcaption class="card-title">
      <span>${title}</span>
      ${data.length > 0 ? `<button class="toggle-btn" data-target="${id}" onclick="toggleView(this)">Table view</button>` : ''}
    </figcaption>
    ${
      data.length === 0
        ? `<p class="empty-state">No data yet — run the test suite to populate this chart.</p>`
        : `
      <div class="chart-view">${rows}</div>
      <table class="table-view hidden">
        <thead><tr><th>Label</th><th>Count</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`
    }
  </figure>`;
}

function renderEmptyReport(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Self-Healing Report</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f9f9f7; color: #0b0b0b; padding: 64px 24px; text-align: center; }
  code { background: #e1e0d9; padding: 2px 6px; border-radius: 4px; }
</style>
</head>
<body>
  <h1>🩹 Self-Healing Report</h1>
  <p>No <code>reports/healing-log.json</code> found yet. Run <code>npm test</code> first, then regenerate with <code>npm run report</code>.</p>
</body>
</html>`;
}

function renderReport(data: HealingReportData): string {
  const { entries, healed, failed, totalAttempts: total } = data;

  const bySpecFile = countBy(entries, e => e.specFile ?? 'unknown');
  const byStrategy = countBy(entries.filter(e => e.healed), e => e.strategyUsed ?? 'unknown');
  const bySelector = countBy(entries, e => e.originalSelector).slice(0, 10);

  const byRecency = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const detailRows = byRecency
    .map(
      e => `
      <tr>
        <td>${escapeHtml(e.testName ?? '—')}</td>
        <td>${escapeHtml(e.specFile ?? '—')}</td>
        <td><code>${escapeHtml(e.originalSelector)}</code></td>
        <td>${escapeHtml(e.strategyUsed ?? '—')}</td>
        <td>${e.healed ? '<span class="status-pill status-pill-good">✓ Healed</span>' : '<span class="status-pill status-pill-critical">✕ Failed</span>'}</td>
        <td>${escapeHtml(new Date(e.timestamp).toLocaleString())}</td>
      </tr>`
    )
    .join('');

  const healedPct = total > 0 ? (healed / total) * 100 : 0;
  const failedPct = 100 - healedPct;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Self-Healing Report</title>
<style>
  * { box-sizing: border-box; }

  /* declared on :root (not .viz-root) so body — an ANCESTOR of .viz-root —
     can also read these custom properties; properties only cascade to
     descendants, never up to ancestors */
  :root {
    color-scheme: light;
    --surface-1:       #fcfcfb;
    --page-plane:      #f9f9f7;
    --text-primary:    #0b0b0b;
    --text-secondary:  #52514e;
    --text-muted:      #898781;
    --gridline:        #e1e0d9;
    --baseline:        #c3c2b7;
    --series-1:        #2a78d6;
    --status-good:      #0ca30c;
    --status-critical:  #d03b3b;
    --border:          rgba(11,11,11,0.10);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --surface-1:       #1a1a19;
      --page-plane:      #0d0d0d;
      --text-primary:    #ffffff;
      --text-secondary:  #c3c2b7;
      --text-muted:      #898781;
      --gridline:        #2c2c2a;
      --baseline:        #383835;
      --series-1:        #3987e5;
      --status-good:      #0ca30c;
      --status-critical:  #d03b3b;
      --border:          rgba(255,255,255,0.10);
    }
  }

  html, body { margin: 0; }
  body {
    background: var(--page-plane);
    color: var(--text-primary);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .viz-root { max-width: 1040px; margin: 0 auto; padding: 32px 20px 64px; }

  header h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: var(--text-secondary); font-size: 13px; margin: 0 0 28px; }

  .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-tile {
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .stat-label { font-size: 12px; color: var(--text-secondary); }
  .stat-value { font-size: 28px; font-weight: 600; }
  .stat-value.status-good { color: var(--status-good); }
  .stat-value.status-critical { color: var(--status-critical); }

  .card {
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 20px;
    margin: 0 0 16px;
  }
  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .toggle-btn {
    font: inherit;
    font-size: 12px;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
  }
  .toggle-btn:hover { color: var(--text-primary); border-color: var(--baseline); }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 720px) { .grid-2 { grid-template-columns: 1fr; } }

  .bar-row { display: grid; grid-template-columns: 140px 1fr 40px; align-items: center; gap: 10px; margin-bottom: 10px; }
  .bar-row:last-child { margin-bottom: 0; }
  .bar-label {
    font-size: 12px; color: var(--text-secondary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .bar-track { background: var(--gridline); border-radius: 4px; height: 16px; position: relative; }
  .bar-fill {
    background: var(--series-1);
    height: 100%;
    min-width: 4px;
    border-radius: 0 4px 4px 0;
  }
  .bar-value { font-size: 12px; color: var(--text-secondary); text-align: right; font-variant-numeric: tabular-nums; }

  .status-bar { display: flex; height: 20px; border-radius: 6px; overflow: hidden; background: var(--gridline); }
  .status-seg-good { background: var(--status-good); }
  .status-seg-critical { background: var(--status-critical); }
  .status-seg-good + .status-seg-critical { margin-left: 2px; }

  .legend { display: flex; gap: 18px; margin-top: 12px; font-size: 12px; color: var(--text-secondary); }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  .swatch-good { background: var(--status-good); }
  .swatch-critical { background: var(--status-critical); }

  .status-pill { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
  .status-pill-good { color: var(--status-good); background: color-mix(in srgb, var(--status-good) 14%, transparent); }
  .status-pill-critical { color: var(--status-critical); background: color-mix(in srgb, var(--status-critical) 14%, transparent); }

  .table-scroll { max-height: 420px; overflow: auto; border: 1px solid var(--border); border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .table-view table { width: 100%; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--gridline); white-space: nowrap; }
  thead th {
    position: sticky; top: 0; background: var(--surface-1);
    color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.04em;
  }
  td code { background: var(--gridline); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
  tbody tr:last-child td { border-bottom: none; }

  .table-view { width: 100%; border-collapse: collapse; font-size: 12px; }
  .table-view th, .table-view td { border-bottom: 1px solid var(--gridline); padding: 6px 8px; }
  .hidden { display: none; }

  .empty-state { color: var(--text-muted); font-size: 13px; margin: 0; }
</style>
</head>
<body>
  <div class="viz-root">
    <header>
      <h1>🩹 Self-Healing Report</h1>
      <p class="subtitle">Generated ${new Date().toLocaleString()} · source: reports/healing-log.json</p>
    </header>

    <section class="kpi-row">
      <div class="stat-tile">
        <span class="stat-label">Total failures</span>
        <span class="stat-value">${total}</span>
      </div>
      <div class="stat-tile">
        <span class="stat-label">✓ Healed</span>
        <span class="stat-value status-good">${healed}</span>
      </div>
      <div class="stat-tile">
        <span class="stat-label">✕ Not healed</span>
        <span class="stat-value status-critical">${failed}</span>
      </div>
      <div class="stat-tile">
        <span class="stat-label">Healing rate</span>
        <span class="stat-value">${data.healingRate}</span>
      </div>
    </section>

    <section class="card">
      <div class="card-title"><span>Healed vs. not healed</span></div>
      ${
        total === 0
          ? `<p class="empty-state">No data yet — run the test suite to populate this chart.</p>`
          : `
      <div class="status-bar" title="Healed: ${healed} · Not healed: ${failed}">
        <div class="status-seg status-seg-good" style="width:${healedPct}%"></div>
        <div class="status-seg status-seg-critical" style="width:${failedPct}%"></div>
      </div>
      <div class="legend">
        <span class="legend-item"><i class="swatch swatch-good"></i>✓ Healed (${healed})</span>
        <span class="legend-item"><i class="swatch swatch-critical"></i>✕ Not healed (${failed})</span>
      </div>`
      }
    </section>

    <div class="grid-2">
      ${renderBarChart('Failures by spec file', bySpecFile, 'chart-spec')}
      ${renderBarChart('Healing strategy usage', byStrategy, 'chart-strategy')}
    </div>

    ${renderBarChart('Most frequently broken selectors (top 10)', bySelector, 'chart-selectors')}

    <section class="card">
      <div class="card-title"><span>All failures (newest first)</span></div>
      ${
        entries.length === 0
          ? `<p class="empty-state">No data yet — run the test suite to populate this table.</p>`
          : `
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Test</th><th>Spec file</th><th>Original selector</th><th>Strategy</th><th>Status</th><th>Timestamp</th></tr>
          </thead>
          <tbody>${detailRows}</tbody>
        </table>
      </div>`
      }
    </section>
  </div>

  <script>
    function toggleView(btn) {
      var card = document.getElementById(btn.dataset.target);
      var chart = card.querySelector('.chart-view');
      var table = card.querySelector('.table-view');
      var showTable = table.classList.contains('hidden');
      table.classList.toggle('hidden', !showTable);
      chart.classList.toggle('hidden', showTable);
      btn.textContent = showTable ? 'Chart view' : 'Table view';
    }
  </script>
</body>
</html>`;
}

export function generateHealingReport(
  jsonPath: string = HEALING_REPORT_JSON_PATH,
  outputPath: string = HEALING_REPORT_HTML_PATH
): string {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(outputPath, renderEmptyReport());
    return outputPath;
  }

  const data: HealingReportData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  fs.writeFileSync(outputPath, renderReport(data));
  return outputPath;
}
