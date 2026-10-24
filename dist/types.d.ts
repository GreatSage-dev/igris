/**
 * Igris - The Silent Gatekeeper
 * Core Type Definitions
 */
export type Verdict = 'REPRODUCED' | 'REFUTED' | 'INDETERMINATE' | 'REJECTED_UNSAFE' | 'PHANTOM_SYMBOL';
export interface VulnerabilityReport {
    id: string;
    title: string;
    description: string;
    targetFile: string;
    targetSymbol: string;
    claimedPayload: string;
    reproductionCode: string;
    environment?: {
        nodeVersion?: string;
        os?: string;
        flags?: string[];
    };
}
export interface GateResult {
    gate: 'G0_SCHEMA' | 'G1_REACHABILITY' | 'G2_SANDBOX' | 'G3_BISECTION';
    passed: boolean;
    verdict: Verdict;
    evidence: string;
    exitCode?: number;
    durationMs: number;
    memoryDeltaMb?: number;
}
export interface BisectionResult {
    culpritCommitSha: string;
    commitAuthor: string;
    commitDate: string;
    commitMessage: string;
    stepsCount: number;
    reproductionCommand: string;
}
export interface IgrisReceipt {
    receiptId: string;
    reportId: string;
    timestamp: string;
    target: {
        file: string;
        symbol: string;
    };
    verdict: Verdict;
    exitCode: number;
    durationMs: number;
    memoryDeltaMb: number;
    gatesEvaluated: GateResult[];
    bisection: BisectionResult | null;
    remediationSummary?: string;
    previousHash?: string;
    autonomyLevel?: AutonomyLevel;
    probationState?: {
        level: AutonomyLevel;
        consecutiveCleanPasses: number;
        demoted: boolean;
    };
    tamperProofHash: string;
}
export type AutonomyLevel = 'LEVEL_1_SUGGEST' | 'LEVEL_2_PROPOSE' | 'LEVEL_3_ACT';
export type AgentAction = 'SUGGEST_FIX' | 'OPEN_MERGE_REQUEST' | 'AUTO_MERGE' | 'DEPLOY';
export interface GitLabPolicyState {
    approvalsRequired: number;
    allowMerge: boolean;
    targetBranchProtected: boolean;
    dailyMergeLimit: number;
    mergesToday: number;
}
export interface ProbationEvaluation {
    allowed: boolean;
    agentId: string;
    currentLevel: AutonomyLevel;
    consecutiveCleanPasses: number;
    actionRequested: AgentAction;
    reason: string;
    demoted: boolean;
    demotedFrom?: AutonomyLevel;
    demotedTo?: AutonomyLevel;
    gitLabPolicy: GitLabPolicyState;
    auditEvidence?: string;
}
export interface SandboxExecutionOptions {
    timeoutMs?: number;
    maxMemoryMb?: number;
    allowNetwork?: boolean;
}
export interface DiffAuditFinding {
    type: 'LEAKED_SECRET' | 'DANGEROUS_SINK' | 'DELETED_TEST' | 'WEAKENED_ASSERTION' | 'SUSPICIOUS_DEPENDENCY';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    detail: string;
    line: string;
    lineNumber?: number;
}
export interface DiffAuditResult {
    verdict: 'CLEAN_DIFF' | 'SUSPICIOUS_MUTATION' | 'ADVISORY_NOTICE';
    passed: boolean;
    deletedTestCount: number;
    deletedTests: string[];
    addedDependencies: string[];
    weakenedAssertions: number;
    leakedSecrets: Array<{
        line: string;
        type: string;
    }>;
    dangerousSinks: Array<{
        line: string;
        type: string;
    }>;
    findings: DiffAuditFinding[];
    summary: string;
}
