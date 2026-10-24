import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProbationEngine, GENESIS_PREVIOUS_HASH } from './probation.js';
describe('Probation Engine: The GitLab Security Standard v1.0', () => {
    it('should initialize a new agent on Level 1 (Probation/Suggest-Only)', () => {
        const engine = new ProbationEngine();
        const agent = engine.getOrCreateAgent('gitlab-duo-flow-agent');
        assert.equal(agent.currentLevel, 'LEVEL_1_SUGGEST');
        assert.equal(agent.consecutiveCleanPasses, 0);
        const policy = engine.getGitLabPolicy(agent.currentLevel);
        assert.equal(policy.allowMerge, false);
        assert.equal(policy.approvalsRequired, 999);
    });
    it('should enforce Level 1 boundaries: allow SUGGEST_FIX, block OPEN_MERGE_REQUEST', () => {
        const engine = new ProbationEngine();
        const agentId = 'agent-newbie';
        // Suggest fix is permitted
        const evalSuggest = engine.evaluateAction({
            agentId,
            action: 'SUGGEST_FIX'
        });
        assert.equal(evalSuggest.allowed, true);
        assert.equal(evalSuggest.currentLevel, 'LEVEL_1_SUGGEST');
        // Opening MR is forbidden at Level 1
        const evalMr = engine.evaluateAction({
            agentId,
            action: 'OPEN_MERGE_REQUEST'
        });
        assert.equal(evalMr.allowed, false);
        assert.match(evalMr.reason, /AUTONOMY_LEVEL_1_RESTRICTION/);
    });
    it('should promote an agent to Level 2 (Propose) after 2 verified clean passes', () => {
        const engine = new ProbationEngine();
        const agentId = 'dependabot-security';
        // Pass 1
        engine.recordVerifiedRun({
            agentId,
            receiptParams: {
                reportId: 'GL-PASS-01',
                targetFile: 'package.json',
                targetSymbol: 'lodash',
                verdict: 'REFUTED',
                exitCode: 0,
                durationMs: 45,
                memoryDeltaMb: 2.1,
                gatesEvaluated: [
                    { gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'Valid schema', durationMs: 1 },
                    { gate: 'G1_REACHABILITY', passed: true, verdict: 'REFUTED', evidence: 'Package exists', durationMs: 4 }
                ],
                bisection: null
            }
        });
        let record = engine.getOrCreateAgent(agentId);
        assert.equal(record.currentLevel, 'LEVEL_1_SUGGEST');
        assert.equal(record.consecutiveCleanPasses, 1);
        // Pass 2 -> triggers promotion to Level 2
        engine.recordVerifiedRun({
            agentId,
            receiptParams: {
                reportId: 'GL-PASS-02',
                targetFile: 'src/config.ts',
                targetSymbol: 'loadConfig',
                verdict: 'REFUTED',
                exitCode: 0,
                durationMs: 38,
                memoryDeltaMb: 1.8,
                gatesEvaluated: [
                    { gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'Valid schema', durationMs: 1 },
                    { gate: 'G1_REACHABILITY', passed: true, verdict: 'REFUTED', evidence: 'Config symbol found', durationMs: 3 }
                ],
                bisection: null
            }
        });
        record = engine.getOrCreateAgent(agentId);
        assert.equal(record.currentLevel, 'LEVEL_2_PROPOSE');
        assert.equal(record.consecutiveCleanPasses, 2);
        // At Level 2, opening MR is now authorized
        const evalMr = engine.evaluateAction({ agentId, action: 'OPEN_MERGE_REQUEST' });
        assert.equal(evalMr.allowed, true);
        assert.equal(evalMr.currentLevel, 'LEVEL_2_PROPOSE');
        assert.equal(evalMr.gitLabPolicy.approvalsRequired, 1);
        // But auto-merging is still forbidden
        const evalMerge = engine.evaluateAction({ agentId, action: 'AUTO_MERGE' });
        assert.equal(evalMerge.allowed, false);
        assert.match(evalMerge.reason, /AUTONOMY_LEVEL_2_RESTRICTION/);
    });
    it('should promote to Level 3 (Act) after 5 passes with human sign-off', () => {
        const engine = new ProbationEngine();
        const agentId = 'trusted-autopilot';
        for (let i = 1; i <= 5; i++) {
            engine.recordVerifiedRun({
                agentId,
                receiptParams: {
                    reportId: `GL-CLEAN-${i}`,
                    targetFile: `src/mod_${i}.ts`,
                    targetSymbol: `func_${i}`,
                    verdict: 'REFUTED',
                    exitCode: 0,
                    durationMs: 30,
                    memoryDeltaMb: 1.5,
                    gatesEvaluated: [
                        { gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'Valid', durationMs: 1 }
                    ],
                    bisection: null
                },
                humanOwnerSignOff: i === 5 // Named human sign-off at 5th pass
            });
        }
        const record = engine.getOrCreateAgent(agentId);
        assert.equal(record.currentLevel, 'LEVEL_3_ACT');
        assert.equal(record.consecutiveCleanPasses, 5);
        // At Level 3, AUTO_MERGE is permitted
        const evalMerge = engine.evaluateAction({ agentId, action: 'AUTO_MERGE' });
        assert.equal(evalMerge.allowed, true);
        assert.equal(evalMerge.currentLevel, 'LEVEL_3_ACT');
        assert.equal(evalMerge.gitLabPolicy.allowMerge, true);
        assert.equal(evalMerge.gitLabPolicy.approvalsRequired, 0);
    });
    it('should DEMOTE on the spot when Level 3 agent tries to delete test assertions', () => {
        const engine = new ProbationEngine();
        const agentId = 'rogue-level-3-agent';
        // Fast-track agent to Level 3
        const record = engine.getOrCreateAgent(agentId);
        record.currentLevel = 'LEVEL_3_ACT';
        record.consecutiveCleanPasses = 5;
        // Agent attempts to merge an MR where it deleted tests to pass a failing check
        const hostileDiffAudit = {
            verdict: 'SUSPICIOUS_MUTATION',
            passed: false,
            deletedTestCount: 2,
            deletedTests: ['test("should validate jwt expiration")', 'assert.strictEqual(res.status, 200)'],
            addedDependencies: [],
            weakenedAssertions: 0,
            leakedSecrets: [],
            dangerousSinks: [],
            findings: [
                {
                    type: 'DELETED_TEST',
                    severity: 'HIGH',
                    detail: 'Deleted 2 test assertions',
                    line: '- assert.strictEqual(res.status, 200);'
                }
            ],
            summary: 'Negative-space audit failed: 2 deleted tests.'
        };
        const evaluation = engine.evaluateAction({
            agentId,
            action: 'AUTO_MERGE',
            diffAudit: hostileDiffAudit
        });
        // 1. Action is strictly forbidden
        assert.equal(evaluation.allowed, false);
        assert.equal(evaluation.demoted, true);
        assert.equal(evaluation.demotedFrom, 'LEVEL_3_ACT');
        assert.equal(evaluation.demotedTo, 'LEVEL_2_PROPOSE');
        // 2. Autonomy level dropped immediately to Level 2
        assert.equal(record.currentLevel, 'LEVEL_2_PROPOSE');
        assert.equal(record.consecutiveCleanPasses, 0); // streak wiped out
        // 3. GitLab policy dynamically changed to require human maintainer sign-off
        assert.equal(evaluation.gitLabPolicy.approvalsRequired, 1);
        assert.equal(evaluation.gitLabPolicy.allowMerge, false);
        // 4. Violation recorded in agent ledger
        assert.equal(record.violations.length, 1);
        assert.match(record.violations[0].reason, /TEST_TAMPERING_DETECTED/);
    });
    it('should verify the cryptographic chain across all ledger receipts', () => {
        const engine = new ProbationEngine();
        const agentId = 'chain-agent';
        // Produce 3 receipts
        const r1 = engine.recordVerifiedRun({
            agentId,
            receiptParams: {
                reportId: 'RUN-01',
                targetFile: 'src/a.ts',
                targetSymbol: 'fnA',
                verdict: 'REFUTED',
                exitCode: 0,
                durationMs: 20,
                memoryDeltaMb: 1.0,
                gatesEvaluated: [{ gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'OK', durationMs: 1 }],
                bisection: null
            }
        });
        const r2 = engine.recordVerifiedRun({
            agentId,
            receiptParams: {
                reportId: 'RUN-02',
                targetFile: 'src/b.ts',
                targetSymbol: 'fnB',
                verdict: 'REFUTED',
                exitCode: 0,
                durationMs: 25,
                memoryDeltaMb: 1.2,
                gatesEvaluated: [{ gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'OK', durationMs: 1 }],
                bisection: null
            }
        });
        const r3 = engine.recordVerifiedRun({
            agentId,
            receiptParams: {
                reportId: 'RUN-03',
                targetFile: 'src/c.ts',
                targetSymbol: 'fnC',
                verdict: 'REFUTED',
                exitCode: 0,
                durationMs: 18,
                memoryDeltaMb: 1.1,
                gatesEvaluated: [{ gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'OK', durationMs: 1 }],
                bisection: null
            }
        });
        // Check genesis link and chaining
        assert.equal(r1.previousHash, GENESIS_PREVIOUS_HASH);
        assert.equal(r2.previousHash, r1.tamperProofHash);
        assert.equal(r3.previousHash, r2.tamperProofHash);
        // Ledger integrity verification
        const integrity = engine.verifyLedgerIntegrity();
        assert.equal(integrity.valid, true);
        assert.equal(integrity.totalReceipts, 3);
    });
});
//# sourceMappingURL=probation.test.js.map