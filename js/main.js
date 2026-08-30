document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const sections = document.querySelectorAll('main section[id]');
const navByHash = new Map(
  Array.from(navLinks.querySelectorAll('a')).map((a) => [a.getAttribute('href'), a])
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = navByHash.get(`#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        navByHash.forEach((a) => a.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach((section) => observer.observe(section));

async function loadQaLabStats() {
  const fallback = { total: '48', browsers: '3', passRate: '—', lastRun: '—' };
  let data = fallback;

  try {
    const res = await fetch('assets/test-summary.json', { cache: 'no-store' });
    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    data = fallback;
  }

  document.querySelectorAll('#qaLabStats [data-field]').forEach((el) => {
    const field = el.getAttribute('data-field');
    if (data[field] !== undefined) el.textContent = data[field];
  });
}

loadQaLabStats();
