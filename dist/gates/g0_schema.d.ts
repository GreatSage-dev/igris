import { VulnerabilityReport, GateResult } from '../types.js';
/**
 * Gate 0: Schema & Completeness Filter
 * Runs in <1ms without spinning up processes or containers.
 * Filters out low-effort spam, empty forms, and missing parameters.
 */
export declare function evaluateGate0(report: Partial<VulnerabilityReport>): GateResult;
