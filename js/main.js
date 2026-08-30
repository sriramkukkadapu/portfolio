const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('main-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

async function loadQaLabStats() {
  const fallback = { total: '54', browsers: '3', passRate: '—', lastRun: '—' };
  let data = fallback;

  try {
    const res = await fetch('assets/test-summary.json', { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch (err) {
    data = fallback;
  }

  document.querySelectorAll('#qaLabMetrics [data-field]').forEach((el) => {
    const field = el.getAttribute('data-field');
    if (data[field] !== undefined) el.textContent = data[field];
  });

  const runLine = document.getElementById('qaLabRunLine');
  const lastRun = document.getElementById('qaLabLastRun');
  const footerSummary = document.getElementById('qaLabFooterSummary');

  if (runLine) {
    runLine.textContent = data.passRate && data.passRate !== '—'
      ? `Last CI run: ${data.total} tests, ${data.passRate} passing across ${data.browsers} browsers.`
      : 'Waiting for the first CI run.';
  }
  if (lastRun) lastRun.textContent = data.lastRun || '—';
  if (footerSummary) footerSummary.textContent = `FULL REGRESSION SUITE · ${data.total || '—'} TESTS`;
}

loadQaLabStats();

/* QA LAB — live Playwright run via a small serverless trigger.
   API_BASE hosts two endpoints (POST /api/run-tests, GET /api/test-status)
   that dispatch and poll the "QA Lab live run" GitHub Actions workflow.
   Until a backend is deployed, this stays a no-op and the button just
   reports that live triggering isn't configured yet. */
(() => {
  const API_BASE = window.QA_LAB_API_BASE || '';

  const GROUPS = [
    { step: 'Run Smoke tests [6]' },
    { step: 'Run Navigation [24]' },
    { step: 'Run Content integrity [9]' },
    { step: 'Run Contact links [3]' },
    { step: 'Run QA Lab [12]' },
  ];
  const TOTAL_TESTS = 54;

  const button = document.getElementById('qaRunButton');
  const lab = document.querySelector('.qa-lab');
  const rows = [...document.querySelectorAll('#qa-lab .qa-test-row')];
  const totalMetric = document.querySelector('#qaLabMetrics [data-field="total"]');
  const passRateMetric = document.querySelector('#qaLabMetrics [data-field="passRate"]');
  const runLine = document.getElementById('qaLabRunLine');
  const consoleBrowser = document.getElementById('qaLabConsoleBrowser');
  const hint = document.getElementById('qaRunHint');
  const screen = document.querySelector('#qa-lab .qa-console-screen');
  if (!button || !lab) return;

  let pollTimer = null;

  function statusIcon(status, conclusion) {
    if (status === 'in_progress' || status === 'queued') return '…';
    if (conclusion === 'success') return '✓';
    if (conclusion === 'failure' || conclusion === 'timed_out') return '×';
    return '–';
  }

  function setButtonState(running) {
    button.disabled = running;
    button.classList.toggle('is-running', running);
    button.innerHTML = running
      ? '<span class="qa-run-spinner" aria-hidden="true"></span><span>RUNNING…</span>'
      : 'RUN QA SUITE';
  }

  function setScreen(lines) {
    if (!screen) return;
    screen.innerHTML = lines.map((l) => `<div class="qa-console-line">${l}</div>`).join('');
  }

  function renderStatus(data) {
    const running = data.status === 'queued' || data.status === 'in_progress';
    const passed = data.conclusion === 'success';
    const failed = data.conclusion === 'failure' || data.conclusion === 'timed_out';
    const progress = data.progress || { passed: 0, failed: 0, total: TOTAL_TESTS };

    lab.classList.toggle('is-running', running);
    setButtonState(running);

    if (totalMetric) totalMetric.textContent = running ? `${progress.passed}/${progress.total}` : String(progress.total);
    if (passRateMetric) {
      passRateMetric.textContent = running
        ? '…'
        : passed
        ? '100%'
        : failed
        ? `${Math.round((progress.passed / progress.total) * 100)}%`
        : '—';
    }

    if (hint) {
      hint.textContent = running
        ? `Running: ${progress.passed}/${progress.total} tests passed so far.`
        : passed
        ? `All ${progress.total}/${progress.total} tests passed on GitHub Actions.`
        : failed
        ? `${progress.passed}/${progress.total} tests passed. Some groups failed — check the run.`
        : 'Run the full Playwright regression suite.';
    }

    if (consoleBrowser) consoleBrowser.textContent = running ? 'Live · GitHub Actions' : `Run #${data.id ?? '—'}`;

    const steps = (data.jobs && data.jobs[0] && data.jobs[0].steps) || [];
    rows.forEach((row, i) => {
      const icon = row.querySelector('.qa-status');
      const group = GROUPS[i];
      if (!icon || !group) return;
      const step = steps.find((s) => s.name === group.step);
      icon.classList.toggle('is-running', step?.status === 'in_progress' || step?.status === 'queued');
      icon.textContent = step ? statusIcon(step.status, step.conclusion) : running ? '…' : '✓';
    });

    const lines = [
      `<span class="qa-prompt">›</span> ${
        running
          ? `Running the real Playwright suite… ${progress.passed}/${progress.total} passed so far.`
          : passed
          ? `Playwright suite completed: ${progress.total}/${progress.total} passed.`
          : failed
          ? `Playwright suite finished: ${progress.passed}/${progress.total} passed.`
          : 'Waiting for test data…'
      }`,
    ];
    if (data.html_url) {
      lines.push(
        `<span class="qa-muted">↳ <a class="qa-live-link" href="${data.html_url}" target="_blank" rel="noopener">View the live GitHub Actions run ↗</a></span>`
      );
    }
    setScreen(lines);
  }

  async function getStatus(runId) {
    const res = await fetch(`${API_BASE}/api/test-status?run_id=${encodeURIComponent(runId)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.json();
  }

  async function poll(runId) {
    try {
      const data = await getStatus(runId);
      renderStatus(data);
      if (data.status !== 'completed') {
        pollTimer = window.setTimeout(() => poll(runId), 2000);
      }
    } catch (err) {
      if (hint) hint.textContent = 'Lost connection to the live status — check the run on GitHub Actions.';
      setButtonState(false);
    }
  }

  button.addEventListener('click', async () => {
    if (!API_BASE) {
      if (hint) hint.textContent = 'Live triggering isn’t configured yet.';
      return;
    }

    if (pollTimer) window.clearTimeout(pollTimer);
    setButtonState(true);
    rows.forEach((row) => {
      const icon = row.querySelector('.qa-status');
      if (icon) icon.textContent = '…';
    });
    if (hint) hint.textContent = `Starting the workflow… 0/${TOTAL_TESTS} tests passed.`;
    setScreen([`<span class="qa-prompt">›</span> Starting the real Playwright run…`]);

    try {
      const res = await fetch(`${API_BASE}/api/run-tests`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `Request failed (${res.status})`);
      if (result.run_id) {
        poll(result.run_id);
      } else {
        setButtonState(false);
        if (hint) hint.textContent = 'Workflow dispatched — check GitHub Actions in a moment.';
      }
    } catch (err) {
      setButtonState(false);
      if (hint) hint.textContent = `Could not start the workflow: ${err.message}`;
    }
  });
})();
