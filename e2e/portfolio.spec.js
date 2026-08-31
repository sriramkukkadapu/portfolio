// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke', () => {
  test('home page loads with the right title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sriram Kukkadapu/);
  });

  test('hero section renders headline and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-copy h1')).toContainText('Sriram Kukkadapu');
    await expect(page.getByRole('link', { name: /About me/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /LinkedIn/ }).first()).toBeVisible();
  });
});

test.describe('Navigation', () => {
  const sections = ['about', 'expertise', 'qa-lab', 'experience', 'work', 'education', 'contact'];

  for (const id of sections) {
    test(`nav link scrolls to #${id}`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`.nav-menu a[href="#${id}"]`).click();
      await expect(page.locator(`#${id}`)).toBeInViewport({ timeout: 5000 });
    });
  }

  test('every section referenced in nav exists exactly once', async ({ page }) => {
    await page.goto('/');
    for (const id of sections) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });
});

test.describe('Content integrity', () => {
  test('experience timeline lists all four roles', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('#experience .timeline-item');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('British Telecom');
    await expect(items.first()).toContainText('QA Engineering Manager');
  });

  test('expertise section shows four skill cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#expertise .expertise-card')).toHaveCount(4);
  });

  test('education lists both degrees', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#education .education-card')).toHaveCount(2);
  });
});

test.describe('Contact links', () => {
  test('contact section has working mailto, LinkedIn, GitHub and blog links', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('#contact .contact-links');
    await expect(contact.getByRole('link', { name: /Email/ })).toHaveAttribute('href', 'mailto:sriramkukkadapu@gmail.com');
    await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/sriramku/');
    await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/sriramkukkadapu');
    await expect(contact.getByRole('link', { name: /Blog/ })).toHaveAttribute('href', 'https://sriramkukkadapu.blogspot.com/');
  });
});

test.describe('QA Lab', () => {
  test('metrics block renders three stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qaLabMetrics [data-field]')).toHaveCount(3);
  });

  test('test group list renders five rows', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qa-lab .qa-test-row')).toHaveCount(5);
  });

  test('test group rows expand to show the real test titles', async ({ page }) => {
    await page.goto('/');
    const row = page.locator('#qa-lab .qa-test-row').first();
    const details = row.locator('.qa-test-details');
    await expect(details).toBeHidden();
    await row.locator('.qa-test-toggle').click();
    await expect(details).toBeVisible();
    await expect(details.getByText('Home page loads with the right title')).toBeVisible();
  });

  test('link to the GitHub test suite is present', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('.qa-lab-footer').getByRole('link', { name: /View Playwright suite on GitHub/ })
    ).toHaveAttribute('href', /github\.com\/sriramkukkadapu\/portfolio/);
  });

  test('run QA suite button is present and enabled', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('#qaRunButton');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('RUN QA SUITE');
    await expect(button).toBeEnabled();
  });
});
