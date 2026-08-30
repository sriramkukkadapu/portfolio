const OWNER = 'sriramkukkadapu';
const REPO = 'portfolio';
const WORKFLOW = 'qa-lab-run.yml';
const ALLOWED_ORIGIN = 'https://sriramkukkadapu.github.io';

function ghHeaders() {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) throw new Error('GH_DISPATCH_TOKEN is not configured');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    res.status(204).end();
    return true;
  }
  return false;
}

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

module.exports = { OWNER, REPO, WORKFLOW, ghHeaders, applyCors, handleOptions, ghFetch };
