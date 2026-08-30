# Sriram Kukkadapu — Portfolio

A single-page portfolio built with plain HTML, CSS, and JavaScript — no framework, no build step.

It ships with its own Playwright end-to-end suite (`e2e/`), run automatically by GitHub Actions
on every push to `main`. The workflow tests the deployed markup, generates a small stats summary
(`assets/test-summary.json`), and deploys the site to GitHub Pages.

## Local development

```bash
npm install
npx playwright install
npm start        # serves the site at http://127.0.0.1:4173
```

## Running the tests

```bash
npm test                # runs the e2e suite against all three browsers
npm run test:summary    # regenerates assets/test-summary.json from the last run
```

## Deploying

Push to `main`. The `.github/workflows/deploy.yml` workflow runs the test suite, stages
`index.html`, `css/`, `js/`, and `assets/` into `dist/`, and publishes it to GitHub Pages.

To enable Pages for this repo: **Settings → Pages → Source → GitHub Actions**.

## Structure

```
index.html   Page markup, single page with anchor navigation
css/         Stylesheet
js/          Nav behaviour + QA Lab stats loader
assets/      Images and the generated test-summary.json
e2e/         Playwright test suite for this site
scripts/     generate-summary.js — turns Playwright's JSON report into assets/test-summary.json
```
