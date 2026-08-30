const { OWNER, REPO, WORKFLOW, ghHeaders, applyCors, handleOptions, ghFetch } = require('./_github');

const GROUPS = [
  { step: 'Run Smoke tests [6]', total: 6 },
  { step: 'Run Navigation [24]', total: 24 },
  { step: 'Run Content integrity [9]', total: 9 },
  { step: 'Run Contact links [3]', total: 3 },
  { step: 'Run QA Lab [12]', total: 12 },
];
const TOTAL_TESTS = GROUPS.reduce((sum, g) => sum + g.total, 0);

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  try {
    let run;
    const runId = req.query.run_id;

    if (runId) {
      run = await ghFetch(`/repos/${OWNER}/${REPO}/actions/runs/${runId}`);
    } else {
      const recent = await ghFetch(
        `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`
      );
      run = (recent.workflow_runs || [])[0];
      if (!run) {
        res.status(200).json({ status: 'idle' });
        return;
      }
    }

    const jobsData = await ghFetch(`/repos/${OWNER}/${REPO}/actions/runs/${run.id}/jobs`);
    const job = (jobsData.jobs || [])[0];
    const steps = job?.steps || [];

    let passed = 0;
    let failed = 0;
    GROUPS.forEach((group) => {
      const step = steps.find((s) => s.name === group.step);
      if (step?.conclusion === 'success') passed += group.total;
      else if (step?.conclusion === 'failure') failed += group.total;
    });

    res.status(200).json({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      jobs: [
        {
          name: job?.name || 'run-suite',
          status: job?.status,
          conclusion: job?.conclusion,
          steps,
        },
      ],
      progress: { passed, failed, total: TOTAL_TESTS },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
