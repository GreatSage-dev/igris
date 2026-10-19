import { auditDiff } from '../dist/diff_audit.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const diffText = body?.diffText || '';

    if (!diffText || typeof diffText !== 'string') {
      return res.status(400).json({ error: 'Missing required string parameter: diffText' });
    }

    const auditResult = auditDiff(diffText);
    return res.status(200).json(auditResult);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Diff audit execution failed' });
  }
}
