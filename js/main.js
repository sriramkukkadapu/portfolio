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
  const fallback = { total: '48', browsers: '3', passRate: '—', lastRun: '—' };
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

async function wireQaRunButton() {
  const btn = document.getElementById('qaRunButton');
  if (!btn) return;

  try {
    const res = await fetch(
      'https://api.github.com/repos/sriramkukkadapu/portfolio/actions/workflows/deploy.yml/runs?per_page=1',
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) return;
    const data = await res.json();
    const run = data.workflow_runs && data.workflow_runs[0];
    if (run && run.html_url) {
      btn.href = run.html_url;
      btn.title = `View the ${run.conclusion || run.status} run from ${run.run_started_at?.slice(0, 10) || ''} on GitHub`;
    }
  } catch (err) {
    // Keep the default link to the workflow's runs list.
  }
}

wireQaRunButton();
