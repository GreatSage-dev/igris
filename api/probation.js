import { ProbationEngine } from '../dist/probation.js';
import { auditDiff } from '../dist/diff_audit.js';

// Serverless singleton instance
const probation = new ProbationEngine();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const { action = 'status', agentId = 'gitlab-duo-flow-security' } = req.query;

    if (action === 'ledger') {
      const ledger = probation.getLedger();
      const integrity = probation.verifyLedgerIntegrity();
      return res.status(200).json({ ledger, integrity });
    }

    const record = probation.getOrCreateAgent(agentId);
    const policy = probation.getGitLabPolicy(record.currentLevel, record.mergesToday);
    return res.status(200).json({
      agentId: record.agentId,
      currentLevel: record.currentLevel,
      consecutiveCleanPasses: record.consecutiveCleanPasses,
      totalPasses: record.totalPasses,
      mergesToday: record.mergesToday,
      gitLabPolicy: policy,
      violations: record.violations
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { type = 'evaluate', agentId = 'gitlab-duo-flow-security', action, diffText, humanSignOffProvided, receiptParams, humanOwnerSignOff } = body;

      if (type === 'record_pass') {
        const receipt = probation.recordVerifiedRun({
          agentId,
          receiptParams,
          humanOwnerSignOff: Boolean(humanOwnerSignOff)
        });
        return res.status(200).json(receipt);
      }

      let diffAudit = undefined;
      if (diffText && typeof diffText === 'string') {
        diffAudit = auditDiff(diffText);
      }

      const evaluation = probation.evaluateAction({
        agentId,
        action,
        diffAudit,
        humanSignOffProvided: Boolean(humanSignOffProvided)
      });

      return res.status(200).json(evaluation);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Probation evaluation failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
