import { AutonomyLevel, AgentAction, ProbationEvaluation, GitLabPolicyState, IgrisReceipt, DiffAuditResult } from './types.js';
import { buildReceipt } from './receipt.js';
export interface AgentRecord {
    agentId: string;
    currentLevel: AutonomyLevel;
    consecutiveCleanPasses: number;
    totalPasses: number;
    mergesToday: number;
    lastMergesResetDate: string;
    lastPromotionDate?: string;
    lastDemotionDate?: string;
    lastDemotionReason?: string;
    violations: Array<{
        timestamp: string;
        action: AgentAction;
        reason: string;
        penalty: string;
    }>;
}
export declare const PROBATION_THRESHOLDS: {
    readonly CLEAN_PASSES_FOR_LEVEL_2: 2;
    readonly CLEAN_PASSES_FOR_LEVEL_3: 5;
    readonly MAX_DAILY_MERGES_LEVEL_3: 5;
};
export declare const GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
/**
 * The Probation Engine
 * Implements The GitLab Security Standard v1.0 (Oct 6, 2026).
 *
 * "Every agent workflow starts on probation, like a new hire.
 *  It earns trust through an unforgeable record, and it loses trust
 *  the moment it breaks the rules."
 */
export declare class ProbationEngine {
    private agents;
    private ledger;
    constructor();
    /**
     * Retrieves or initializes an agent record at Level 1 (Probation).
     */
    getOrCreateAgent(agentId: string): AgentRecord;
    /**
     * Evaluates an agent's requested action against its current autonomy level
     * and optional Merge Request diff audit results.
     */
    evaluateAction(params: {
        agentId: string;
        action: AgentAction;
        diffAudit?: DiffAuditResult;
        humanSignOffProvided?: boolean;
    }): ProbationEvaluation;
    /**
     * Records a verified clean run receipt in the chained ledger.
     * Advances the agent's consecutive clean pass streak and evaluates promotion.
     */
    recordVerifiedRun(params: {
        agentId: string;
        receiptParams: Parameters<typeof buildReceipt>[0];
        humanOwnerSignOff?: boolean;
    }): IgrisReceipt;
    /**
     * Generates the concrete GitLab Security & Approval Policy payload.
     */
    getGitLabPolicy(level: AutonomyLevel, mergesToday?: number): GitLabPolicyState;
    /**
     * Returns current ledger of chained receipts.
     */
    getLedger(): readonly IgrisReceipt[];
    /**
     * Cryptographically verifies the entire ledger chain.
     * Proves that no receipt has been modified, reordered, or deleted.
     */
    verifyLedgerIntegrity(): {
        valid: boolean;
        totalReceipts: number;
        brokenIndex?: number;
        reason?: string;
    };
}
