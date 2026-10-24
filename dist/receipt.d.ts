import { IgrisReceipt, GateResult, Verdict, BisectionResult, AutonomyLevel } from './types.js';
/**
 * Builds an immutable, tamper-evident evidence receipt for GitLab issues/MRs.
 * Chains cryptographic hashes (previousHash) to establish an unforgeable ledger.
 */
export declare function buildReceipt(params: {
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
    previousHash?: string;
    autonomyLevel?: AutonomyLevel;
    probationState?: {
        level: AutonomyLevel;
        consecutiveCleanPasses: number;
        demoted: boolean;
    };
}): IgrisReceipt;
/**
 * Deterministically checks whether a receipt's SHA-256 seal matches its payload.
 */
export declare function verifyReceiptSignature(receipt: IgrisReceipt): boolean;
/**
 * Formats the receipt as a clean, high-contrast GitLab discussion comment.
 */
export declare function formatReceiptMarkdown(receipt: IgrisReceipt): string;
