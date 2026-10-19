/**
 * Igris - The Silent Gatekeeper
 * Negative-Space & Vibe-Coding Vulnerability Diff Auditor
 *
 * Zero-Trust Vibe-Coding Invariant Standard & Attack Classes:
 * 1. Hardcoded Service Role & API Secrets in client/server diffs
 * 2. Dangerous Execution Sinks (eval, child_process shell, raw SQL interpolation)
 * 3. Negative-space Test Erasure (deleting expect, assert, it, test blocks)
 * 4. Assertion Weakening (mutating strict invariants into trivial booleans)
 * 5. Unpinned or Suspicious Dependency Injection
 */
import { DiffAuditResult } from './types.js';
export declare function auditDiff(diffText: string): DiffAuditResult;
