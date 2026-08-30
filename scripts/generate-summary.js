// Reads Playwright's JSON reporter output and writes a small summary
// consumed by assets/test-summary.json for the QA Lab section on the page.
const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '..', 'test-results', 'results.json');
const outPath = path.join(__dirname, '..', 'assets', 'test-summary.json');

const raw = fs.readFileSync(resultsPath, 'utf-8');
const results = JSON.parse(raw);

let total = 0;
let passed = 0;
const browsers = new Set();

for (const suite of results.suites || []) {
  walkSuite(suite);
}

function walkSuite(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      total += 1;
      browsers.add(test.projectName);
      const ok = (test.results || []).some((r) => r.status === 'passed');
      if (ok) passed += 1;
    }
  }
  for (const child of suite.suites || []) {
    walkSuite(child);
  }
}

const passRate = total > 0 ? `${Math.round((passed / total) * 100)}%` : '—';

const summary = {
  total: String(total),
  browsers: String(browsers.size),
  passRate,
  lastRun: new Date().toISOString().slice(0, 10),
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log('Wrote', outPath, summary);
