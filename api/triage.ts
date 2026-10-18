import { IgrisEngine } from '../src/engine.js';
import { VulnerabilityReport } from '../src/types.js';

const engine = new IgrisEngine();

export default async function handler(req: any, res: any) {
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
    const report: VulnerabilityReport =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const receipt = await engine.triageReport(report, {
      repoRoot: process.cwd()
    });

    return res.status(200).json(receipt);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Triage execution failed' });
  }
}
