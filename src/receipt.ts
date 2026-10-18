import crypto from 'node:crypto';
import { IgrisReceipt, GateResult, Verdict, BisectionResult } from './types.js';

/**
 * Builds an immutable, tamper-evident evidence receipt for GitLab issues/MRs.
 */
export function buildReceipt(params: {
  reportId: string;
  targetFile: string;
  targetSymbol: string;
  verdict: Verdict;
  exitCode: number;
  durationMs: number;
  memoryDeltaMb: number;
  gatesEvaluated: GateResult[];
  bisection: BisectionResult | null;
  remediationSummary?: string;
}): IgrisReceipt {
  const timestamp = new Date().toISOString();
  const receiptId = `IGRIS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  // Generate SHA256 signature over critical execution parameters
  const payloadToSign = JSON.stringify({
    receiptId,
    reportId: params.reportId,
    timestamp,
    target: `${params.targetFile}#${params.targetSymbol}`,
    verdict: params.verdict,
    exitCode: params.exitCode,
    durationMs: params.durationMs
  });
  const tamperProofHash = crypto.createHash('sha256').update(payloadToSign).digest('hex');

  return {
    receiptId,
    reportId: params.reportId,
    timestamp,
    target: {
      file: params.targetFile,
      symbol: params.targetSymbol
    },
    verdict: params.verdict,
    exitCode: params.exitCode,
    durationMs: params.durationMs,
    memoryDeltaMb: params.memoryDeltaMb,
    gatesEvaluated: params.gatesEvaluated,
    bisection: params.bisection,
    remediationSummary: params.remediationSummary,
    tamperProofHash
  };
}

/**
 * Deterministically checks whether a receipt's SHA-256 seal matches its payload.
 */
export function verifyReceiptSignature(receipt: IgrisReceipt): boolean {
  const payloadToSign = JSON.stringify({
    receiptId: receipt.receiptId,
    reportId: receipt.reportId,
    timestamp: receipt.timestamp,
    target: `${receipt.target.file}#${receipt.target.symbol}`,
    verdict: receipt.verdict,
    exitCode: receipt.exitCode,
    durationMs: receipt.durationMs
  });
  const computedHash = crypto.createHash('sha256').update(payloadToSign).digest('hex');
  return computedHash === receipt.tamperProofHash;
}

/**
 * Formats the receipt as a clean, high-contrast GitLab discussion comment.
 */
export function formatReceiptMarkdown(receipt: IgrisReceipt): string {
  const verdictEmoji =
    receipt.verdict === 'REPRODUCED'
      ? '🚨 **CONFIRMED THREAT (REPRODUCED)**'
      : receipt.verdict === 'REFUTED'
      ? '🛡️ **REFUTED (LIKELY AI SLOP / FALSE ALARM)**'
      : receipt.verdict === 'REJECTED_UNSAFE'
      ? '🛑 **SECURITY LOCK: MALICIOUS INJECTION BLOCKED**'
      : receipt.verdict === 'PHANTOM_SYMBOL'
      ? '👻 **REJECTED: PHANTOM SYMBOL (HALLUCINATED CODE)**'
      : '⚠️ **INDETERMINATE (INSUFFICIENT EVIDENCE)**';

  let md = `## ${verdictEmoji}\n\n`;
  md += `> **Igris Silent Gatekeeper Receipt** \`#${receipt.receiptId}\`  \n`;
  md += `> *Timestamp: ${receipt.timestamp} | Target: \`${receipt.target.file}#${receipt.target.symbol}\`*\n\n`;

  md += `| Verification Metric | Deterministic Measurement |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Process Exit Code** | \`${receipt.exitCode}\` |\n`;
  md += `| **Quarantine Duration** | \`${receipt.durationMs}ms\` |\n`;
  md += `| **Heap Delta** | \`${receipt.memoryDeltaMb}MB\` |\n`;
  md += `| **Tamper-Proof Hash** | \`${receipt.tamperProofHash.slice(0, 16)}...\` |\n\n`;

  md += `### 🔍 Gate Evaluation Cascade\n`;
  for (const g of receipt.gatesEvaluated) {
    const statusIcon = g.passed ? '✅' : g.verdict === 'REFUTED' ? '🛡️' : '❌';
    md += `- **[${g.gate}]** ${statusIcon} \`${g.verdict}\` (${g.durationMs}ms) — *${g.evidence}*\n`;
  }

  if (receipt.bisection) {
    md += `\n### ⏳ Automated Git Bisection (Issue #989 Resolution)\n`;
    md += `- **First Bad Commit:** \`${receipt.bisection.culpritCommitSha}\`\n`;
    md += `- **Author:** ${receipt.bisection.commitAuthor}\n`;
    md += `- **Date:** ${receipt.bisection.commitDate}\n`;
    md += `- **Commit Message:** _"${receipt.bisection.commitMessage}"_\n`;
    md += `- **Search Depth:** Bisected across history in ${receipt.bisection.stepsCount} steps.\n`;
  }

  if (receipt.remediationSummary) {
    md += `\n### 🩹 Remediation Status\n`;
    md += `${receipt.remediationSummary}\n`;
  }

  return md;
}
