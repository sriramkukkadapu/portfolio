// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke', () => {
  test('home page loads with the right title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sriram Kukkadapu/);
  });

  test('hero section renders headline and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero__title')).toBeVisible();
    await expect(page.getByRole('link', { name: 'More about me' })).toBeVisible();
  });
});

test.describe('Navigation', () => {
  const sections = ['about', 'expertise', 'qa-lab', 'experience', 'work', 'education', 'contact'];

  for (const id of sections) {
    test(`nav link scrolls to #${id}`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`.nav__links a[href="#${id}"]`).click();
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
    const items = page.locator('#experience .timeline__item');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('QA Engineering Manager');
  });

  test('expertise section shows four skill cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#expertise .card')).toHaveCount(4);
  });

  test('education lists both degrees', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#education .card')).toHaveCount(2);
  });
});

test.describe('Contact links', () => {
  test('contact section has working mailto, LinkedIn, GitHub and blog links', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:sriramkukkadapu@gmail.com');
    await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/sriramku/');
    await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/sriramkukkadapu');
    await expect(contact.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', 'https://sriramkukkadapu.blogspot.com/');
  });
});

test.describe('QA Lab', () => {
  test('stats block renders four stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qaLabStats .stat')).toHaveCount(4);
  });

  test('link to the GitHub test suite is present', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('#qa-lab').getByRole('link', { name: /View the test suite on GitHub/ })
    ).toHaveAttribute('href', /github\.com\/sriramkukkadapu\/portfolio/);
  });
});
