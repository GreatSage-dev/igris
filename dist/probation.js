import { buildReceipt, verifyReceiptSignature } from './receipt.js';
export const PROBATION_THRESHOLDS = {
    CLEAN_PASSES_FOR_LEVEL_2: 2,
    CLEAN_PASSES_FOR_LEVEL_3: 5,
    MAX_DAILY_MERGES_LEVEL_3: 5
};
export const GENESIS_PREVIOUS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
/**
 * The Probation Engine
 * Implements The GitLab Security Standard v1.0 (Oct 6, 2026).
 *
 * "Every agent workflow starts on probation, like a new hire.
 *  It earns trust through an unforgeable record, and it loses trust
 *  the moment it breaks the rules."
 */
export class ProbationEngine {
    agents = new Map();
    ledger = [];
    constructor() { }
    /**
     * Retrieves or initializes an agent record at Level 1 (Probation).
     */
    getOrCreateAgent(agentId) {
        const today = new Date().toISOString().slice(0, 10);
        let record = this.agents.get(agentId);
        if (!record) {
            record = {
                agentId,
                currentLevel: 'LEVEL_1_SUGGEST',
                consecutiveCleanPasses: 0,
                totalPasses: 0,
                mergesToday: 0,
                lastMergesResetDate: today,
                violations: []
            };
            this.agents.set(agentId, record);
        }
        // Reset daily merge counters if day changed
        if (record.lastMergesResetDate !== today) {
            record.mergesToday = 0;
            record.lastMergesResetDate = today;
        }
        return record;
    }
    /**
     * Evaluates an agent's requested action against its current autonomy level
     * and optional Merge Request diff audit results.
     */
    evaluateAction(params) {
        const agent = this.getOrCreateAgent(params.agentId);
        const now = new Date().toISOString();
        // 1. Check for negative-space safety violations (Diff Tampering / Secret Leakage)
        if (params.diffAudit) {
            const hasDeletedTests = params.diffAudit.deletedTestCount > 0 || params.diffAudit.weakenedAssertions > 0;
            const hasLeakedSecrets = params.diffAudit.leakedSecrets.length > 0;
            const hasDangerousSinks = params.diffAudit.dangerousSinks.length > 0;
            if (hasDeletedTests) {
                const previousLevel = agent.currentLevel;
                // Immediate Demotion: Level 3 drops to Level 2; Level 2 drops to Level 1
                const newLevel = previousLevel === 'LEVEL_3_ACT' ? 'LEVEL_2_PROPOSE' : 'LEVEL_1_SUGGEST';
                agent.currentLevel = newLevel;
                agent.consecutiveCleanPasses = 0;
                agent.lastDemotionDate = now;
                agent.lastDemotionReason = `TEST_TAMPERING_DETECTED: Agent deleted ${params.diffAudit.deletedTestCount} test assertion(s) to pass its own MR.`;
                agent.violations.push({
                    timestamp: now,
                    action: params.action,
                    reason: agent.lastDemotionReason,
                    penalty: `Demoted from ${previousLevel} to ${newLevel}. Streak reset to 0.`
                });
                return {
                    allowed: false,
                    agentId: agent.agentId,
                    currentLevel: agent.currentLevel,
                    consecutiveCleanPasses: 0,
                    actionRequested: params.action,
                    reason: agent.lastDemotionReason,
                    demoted: true,
                    demotedFrom: previousLevel,
                    demotedTo: newLevel,
                    gitLabPolicy: this.getGitLabPolicy(agent.currentLevel, agent.mergesToday),
                    auditEvidence: `Deleted tests: [${params.diffAudit.deletedTests.join(', ')}]`
                };
            }
            if (hasLeakedSecrets || hasDangerousSinks) {
                const previousLevel = agent.currentLevel;
                agent.currentLevel = 'LEVEL_1_SUGGEST';
                agent.consecutiveCleanPasses = 0;
                agent.lastDemotionDate = now;
                agent.lastDemotionReason = hasLeakedSecrets
                    ? 'CREDENTIAL_LEAKAGE: Diff contained hardcoded authentication secrets.'
                    : 'DANGEROUS_SINK: Diff introduced unsafe command execution sinks (eval/exec).';
                agent.violations.push({
                    timestamp: now,
                    action: params.action,
                    reason: agent.lastDemotionReason,
                    penalty: `Demoted to LEVEL_1_SUGGEST. Streak reset to 0.`
                });
                return {
                    allowed: false,
                    agentId: agent.agentId,
                    currentLevel: agent.currentLevel,
                    consecutiveCleanPasses: 0,
                    actionRequested: params.action,
                    reason: agent.lastDemotionReason,
                    demoted: true,
                    demotedFrom: previousLevel,
                    demotedTo: 'LEVEL_1_SUGGEST',
                    gitLabPolicy: this.getGitLabPolicy(agent.currentLevel, agent.mergesToday)
                };
            }
        }
        // 2. Validate requested action against current autonomy boundaries
        switch (agent.currentLevel) {
            case 'LEVEL_1_SUGGEST': {
                if (params.action !== 'SUGGEST_FIX') {
                    return {
                        allowed: false,
                        agentId: agent.agentId,
                        currentLevel: agent.currentLevel,
                        consecutiveCleanPasses: agent.consecutiveCleanPasses,
                        actionRequested: params.action,
                        reason: `AUTONOMY_LEVEL_1_RESTRICTION: Agent '${agent.agentId}' is on probation. It can only suggest fixes as discussion comments. Opening MRs or merging is prohibited.`,
                        demoted: false,
                        gitLabPolicy: this.getGitLabPolicy(agent.currentLevel, agent.mergesToday)
                    };
                }
                break;
            }
            case 'LEVEL_2_PROPOSE': {
                if (params.action === 'AUTO_MERGE' || params.action === 'DEPLOY') {
                    return {
                        allowed: false,
                        agentId: agent.agentId,
                        currentLevel: agent.currentLevel,
                        consecutiveCleanPasses: agent.consecutiveCleanPasses,
                        actionRequested: params.action,
                        reason: `AUTONOMY_LEVEL_2_RESTRICTION: Agent '${agent.agentId}' is supervised. It may open Merge Requests, but merging requires named human maintainer approval.`,
                        demoted: false,
                        gitLabPolicy: this.getGitLabPolicy(agent.currentLevel, agent.mergesToday)
                    };
                }
                break;
            }
            case 'LEVEL_3_ACT': {
                if (params.action === 'AUTO_MERGE') {
                    if (agent.mergesToday >= PROBATION_THRESHOLDS.MAX_DAILY_MERGES_LEVEL_3) {
                        return {
                            allowed: false,
                            agentId: agent.agentId,
                            currentLevel: agent.currentLevel,
                            consecutiveCleanPasses: agent.consecutiveCleanPasses,
                            actionRequested: params.action,
                            reason: `DAILY_MERGE_LIMIT_REACHED: Agent '${agent.agentId}' has completed ${agent.mergesToday}/${PROBATION_THRESHOLDS.MAX_DAILY_MERGES_LEVEL_3} autonomous merges today. Further merges require manual override.`,
                            demoted: false,
                            gitLabPolicy: this.getGitLabPolicy(agent.currentLevel, agent.mergesToday)
                        };
                    }
                }
                break;
            }
        }
        return {
            allowed: true,
            agentId: agent.agentId,
            currentLevel: agent.currentLevel,
            consecutiveCleanPasses: agent.consecutiveCleanPasses,
            actionRequested: params.action,
            reason: `Action '${params.action}' authorized under ${agent.currentLevel}.`,
            demoted: false,
            gitLabPolicy: this.getGitLabPolicy(agent.currentLevel, agent.mergesToday)
        };
    }
    /**
     * Records a verified clean run receipt in the chained ledger.
     * Advances the agent's consecutive clean pass streak and evaluates promotion.
     */
    recordVerifiedRun(params) {
        const agent = this.getOrCreateAgent(params.agentId);
        const now = new Date().toISOString();
        // Fetch previous hash from ledger tail (or genesis hash)
        const previousHash = this.ledger.length > 0
            ? this.ledger[this.ledger.length - 1].tamperProofHash
            : GENESIS_PREVIOUS_HASH;
        // Check if run passed cleanly
        const isClean = params.receiptParams.verdict === 'REFUTED' ||
            (params.receiptParams.verdict === 'REPRODUCED' &&
                params.receiptParams.gatesEvaluated.every((g) => g.passed));
        let demoted = false;
        if (isClean) {
            agent.consecutiveCleanPasses++;
            agent.totalPasses++;
            // Evaluate Promotion Rules
            if (agent.currentLevel === 'LEVEL_1_SUGGEST' &&
                agent.consecutiveCleanPasses >= PROBATION_THRESHOLDS.CLEAN_PASSES_FOR_LEVEL_2) {
                agent.currentLevel = 'LEVEL_2_PROPOSE';
                agent.lastPromotionDate = now;
            }
            else if (agent.currentLevel === 'LEVEL_2_PROPOSE' &&
                agent.consecutiveCleanPasses >= PROBATION_THRESHOLDS.CLEAN_PASSES_FOR_LEVEL_3 &&
                params.humanOwnerSignOff === true) {
                agent.currentLevel = 'LEVEL_3_ACT';
                agent.lastPromotionDate = now;
            }
        }
        else {
            agent.consecutiveCleanPasses = 0;
        }
        // Build the chained receipt
        const receipt = buildReceipt({
            ...params.receiptParams,
            previousHash,
            autonomyLevel: agent.currentLevel,
            probationState: {
                level: agent.currentLevel,
                consecutiveCleanPasses: agent.consecutiveCleanPasses,
                demoted
            }
        });
        this.ledger.push(receipt);
        return receipt;
    }
    /**
     * Generates the concrete GitLab Security & Approval Policy payload.
     */
    getGitLabPolicy(level, mergesToday = 0) {
        switch (level) {
            case 'LEVEL_1_SUGGEST':
                return {
                    approvalsRequired: 999, // Unmergable via API
                    allowMerge: false,
                    targetBranchProtected: true,
                    dailyMergeLimit: 0,
                    mergesToday
                };
            case 'LEVEL_2_PROPOSE':
                return {
                    approvalsRequired: 1, // Requires named maintainer sign-off
                    allowMerge: false,
                    targetBranchProtected: true,
                    dailyMergeLimit: 0,
                    mergesToday
                };
            case 'LEVEL_3_ACT':
                return {
                    approvalsRequired: 0, // Auto-merge authorized within guardrail
                    allowMerge: mergesToday < PROBATION_THRESHOLDS.MAX_DAILY_MERGES_LEVEL_3,
                    targetBranchProtected: true,
                    dailyMergeLimit: PROBATION_THRESHOLDS.MAX_DAILY_MERGES_LEVEL_3,
                    mergesToday
                };
        }
    }
    /**
     * Returns current ledger of chained receipts.
     */
    getLedger() {
        return this.ledger;
    }
    /**
     * Cryptographically verifies the entire ledger chain.
     * Proves that no receipt has been modified, reordered, or deleted.
     */
    verifyLedgerIntegrity() {
        if (this.ledger.length === 0) {
            return { valid: true, totalReceipts: 0 };
        }
        for (let i = 0; i < this.ledger.length; i++) {
            const current = this.ledger[i];
            // 1. Verify individual signature
            if (!verifyReceiptSignature(current)) {
                return {
                    valid: false,
                    totalReceipts: this.ledger.length,
                    brokenIndex: i,
                    reason: `Receipt signature mismatch at index ${i} (#${current.receiptId})`
                };
            }
            // 2. Verify chain linkage
            const expectedPrevHash = i === 0 ? GENESIS_PREVIOUS_HASH : this.ledger[i - 1].tamperProofHash;
            if (current.previousHash !== expectedPrevHash) {
                return {
                    valid: false,
                    totalReceipts: this.ledger.length,
                    brokenIndex: i,
                    reason: `Broken chain link at index ${i}: stored previousHash does not match prior receipt hash.`
                };
            }
        }
        return { valid: true, totalReceipts: this.ledger.length };
    }
}
//# sourceMappingURL=probation.js.map