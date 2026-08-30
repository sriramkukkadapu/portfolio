# QA Lab live-trigger backend

Two serverless functions that let the "RUN QA SUITE" button on the portfolio
actually dispatch and poll the **QA Lab live run** GitHub Actions workflow
(`.github/workflows/qa-lab-run.yml`), instead of just linking to a past run.

- `POST /api/run-tests` — dispatches the workflow (or returns the currently
  running one, so a second click never queues a duplicate run).
- `GET /api/test-status?run_id=...` — polls that run's job/step status and
  returns per-test-group progress.

Both need a GitHub token with **Actions: Read and write** access to this repo,
read from `process.env.GH_DISPATCH_TOKEN`. Never commit that token.

## Deploying (Vercel)

1. On [vercel.com](https://vercel.com), **Add New → Project** and import the
   `sriramkukkadapu/portfolio` GitHub repo. Framework preset: "Other". Leave
   build settings empty — there's nothing to build, Vercel just needs to see
   the `api/` folder.
2. In GitHub, create a **fine-grained personal access token**
   (Settings → Developer settings → Fine-grained tokens → Generate new token):
   - Repository access: **only** `sriramkukkadapu/portfolio`.
   - Permissions: **Actions → Read and write**.
3. In the Vercel project → Settings → Environment Variables, add
   `GH_DISPATCH_TOKEN` with that token's value. Paste it directly into
   Vercel's dashboard — it never needs to pass through any AI assistant,
   terminal history, or the git repo.
4. Deploy. Copy the resulting production URL (e.g.
   `https://portfolio-xxxx.vercel.app`).
5. Set that URL as `window.QA_LAB_API_BASE` in `index.html` (near the bottom,
   just above the `js/main.js` script tag) and push.

If `GH_DISPATCH_TOKEN` is ever exposed, revoke it immediately from
GitHub's fine-grained token settings and issue a new one.
