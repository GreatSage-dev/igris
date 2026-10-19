import { VulnerabilityReport, GateResult } from '../types.js';
/**
 * Gate 1: Code Reachability & Symbol Existence
 * Checks if the claimed target file and function actually exist in the codebase.
 * Filters out the #1 failure mode identified by curl (Daniel Stenberg):
 * AI models hallucinating non-existent function names and fake code paths.
 */
export declare function evaluateGate1(report: VulnerabilityReport, repoRoot: string): GateResult;
