import { evaluateGate0 } from './gates/g0_schema.js';
import { evaluateGate1 } from './gates/g1_reachability.js';
import { evaluateGate2 } from './gates/g2_sandbox.js';
import { runAutomatedBisection } from './gates/g3_bisect.js';
import { buildReceipt } from './receipt.js';
export class IgrisEngine {
    /**
     * Evaluates an incoming vulnerability report through the 4-gate defense cascade.
     */
    async triageReport(report, options) {
        const startTime = performance.now();
        const gatesEvaluated = [];
        // GATE 0: Schema & Completeness (<1ms)
        const g0 = evaluateGate0(report);
        gatesEvaluated.push(g0);
        if (!g0.passed) {
            return buildReceipt({
                reportId: report.id || 'UNKNOWN',
                targetFile: report.targetFile || 'NONE',
                targetSymbol: report.targetSymbol || 'NONE',
                verdict: g0.verdict,
                exitCode: 1,
                durationMs: Number((performance.now() - startTime).toFixed(2)),
                memoryDeltaMb: 0,
                gatesEvaluated,
                bisection: null,
                remediationSummary: 'Rejected at Gate 0: Report does not meet minimum schema requirements.'
            });
        }
        // GATE 1: Code Reachability & Symbol Existence (<10ms)
        const g1 = evaluateGate1(report, options.repoRoot);
        gatesEvaluated.push(g1);
        if (!g1.passed) {
            return buildReceipt({
                reportId: report.id,
                targetFile: report.targetFile,
                targetSymbol: report.targetSymbol,
                verdict: g1.verdict,
                exitCode: 1,
                durationMs: Number((performance.now() - startTime).toFixed(2)),
                memoryDeltaMb: 0,
                gatesEvaluated,
                bisection: null,
                remediationSummary: 'Rejected at Gate 1: Target file or function is non-existent in this repository (hallucinated code).'
            });
        }
        // GATE 2: The Quarantine Blast Chamber (<3000ms)
        const g2 = await evaluateGate2(report, options.repoRoot, options.sandboxOptions);
        gatesEvaluated.push(g2);
        let bisectionResult = null;
        // GATE 3: Automated Bisection (Only if vulnerability was confirmed real)
        if (g2.verdict === 'REPRODUCED' && options.enableBisection && options.knownGoodCommitSha && options.reproCommand) {
            const bisectionStart = performance.now();
            bisectionResult = runAutomatedBisection(options.repoRoot, options.knownGoodCommitSha, options.reproCommand);
            gatesEvaluated.push({
                gate: 'G3_BISECTION',
                passed: bisectionResult !== null,
                verdict: 'REPRODUCED',
                evidence: bisectionResult
                    ? `Regression bisected to commit ${bisectionResult.culpritCommitSha} by ${bisectionResult.commitAuthor}`
                    : 'Bisection skipped or inconclusive.',
                durationMs: Number((performance.now() - bisectionStart).toFixed(2))
            });
        }
        const totalDuration = Number((performance.now() - startTime).toFixed(2));
        return buildReceipt({
            reportId: report.id,
            targetFile: report.targetFile,
            targetSymbol: report.targetSymbol,
            verdict: g2.verdict,
            exitCode: g2.exitCode ?? (g2.verdict === 'REPRODUCED' ? 1 : 0),
            durationMs: totalDuration,
            memoryDeltaMb: g2.memoryDeltaMb ?? 0,
            gatesEvaluated,
            bisection: bisectionResult,
            remediationSummary: g2.verdict === 'REPRODUCED'
                ? 'CRITICAL: Verified zero-day vulnerability reproduced in sandbox. Issue moved to private quarantine. Remediation patch recommended.'
                : g2.verdict === 'REFUTED'
                    ? 'SAFE: Report thoroughly refuted in blast chamber. Function executed with claimed payload safely. Marked as False Alarm / AI Slop.'
                    : g2.verdict === 'REJECTED_UNSAFE'
                        ? 'BLOCKED: Malicious command injection detected in report payload. Runner execution halted.'
                        : 'INCONCLUSIVE: Insufficient evidence to deterministically reproduce.'
        });
    }
}
//# sourceMappingURL=engine.js.map