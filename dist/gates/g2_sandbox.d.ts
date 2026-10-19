import { VulnerabilityReport, GateResult, SandboxExecutionOptions } from '../types.js';
/**
 * Gate 2: The Quarantine Blast Chamber
 * Executes reproduction logic in an isolated subprocess with:
 * - Zero network access (clean stripped environment)
 * - Strict timeout (default 3000ms)
 * - Sanitized security checks against RCE/injection
 * - Real process exit codes (code === 0 vs code !== 0)
 */
export declare function evaluateGate2(report: VulnerabilityReport, repoRoot: string, options?: SandboxExecutionOptions): Promise<GateResult>;
