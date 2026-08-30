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
