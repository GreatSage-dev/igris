/**
 * Igris - The Silent Gatekeeper
 * Core Type Definitions
 */

export type Verdict =
  | 'REPRODUCED'            // Confirmed vulnerability/bug: script triggered error (exit code != 0)
  | 'REFUTED'               // Disproved claim: script completed safely without error (exit code 0)
  | 'INDETERMINATE'         // Epistemic refusal: missing parameters or un-reproducible environment
  | 'REJECTED_UNSAFE'       // Security violation: malicious command injection detected in report
  | 'PHANTOM_SYMBOL';       // Hallucinated function/file: target does not exist in codebase

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
  tamperProofHash: string;
}

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  maxMemoryMb?: number;
  allowNetwork?: boolean;
}
