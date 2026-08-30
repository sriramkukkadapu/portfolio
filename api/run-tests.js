const { OWNER, REPO, WORKFLOW, ghHeaders, applyCors, handleOptions, ghFetch } = require('./_github');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const recent = await ghFetch(
      `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=5`
    );
    const active = (recent.workflow_runs || []).find(
      (r) => r.status === 'queued' || r.status === 'in_progress'
    );
    if (active) {
      res.status(200).json({ run_id: active.id, already_running: true });
      return;
    }

    const dispatchedAt = Date.now();
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: 'POST',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'main' }),
      }
    );
    if (!dispatchRes.ok) {
      const text = await dispatchRes.text();
      res.status(502).json({ error: `GitHub dispatch failed: ${dispatchRes.status} ${text}` });
      return;
    }

    let runId = null;
    for (let i = 0; i < 8 && !runId; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const poll = await ghFetch(
        `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=5`
      );
      const candidate = (poll.workflow_runs || []).find(
        (r) =>
          new Date(r.created_at).getTime() >= dispatchedAt - 5000 &&
          (r.status === 'queued' || r.status === 'in_progress')
      );
      if (candidate) runId = candidate.id;
    }

    if (!runId) {
      res.status(202).json({ run_id: null, message: 'Dispatched, run not yet visible' });
      return;
    }
    res.status(200).json({ run_id: runId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
