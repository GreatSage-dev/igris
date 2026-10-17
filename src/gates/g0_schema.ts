import { VulnerabilityReport, GateResult } from '../types.js';

/**
 * Gate 0: Schema & Completeness Filter
 * Runs in <1ms without spinning up processes or containers.
 * Filters out low-effort spam, empty forms, and missing parameters.
 */
export function evaluateGate0(report: Partial<VulnerabilityReport>): GateResult {
  const start = performance.now();

  if (!report.id || typeof report.id !== 'string') {
    return {
      gate: 'G0_SCHEMA',
      passed: false,
      verdict: 'INDETERMINATE',
      evidence: 'Missing required field: report id',
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  }

  if (!report.targetFile || typeof report.targetFile !== 'string') {
    return {
      gate: 'G0_SCHEMA',
      passed: false,
      verdict: 'INDETERMINATE',
      evidence: 'Missing required field: targetFile (no file path specified)',
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  }

  if (!report.targetSymbol || typeof report.targetSymbol !== 'string') {
    return {
      gate: 'G0_SCHEMA',
      passed: false,
      verdict: 'INDETERMINATE',
      evidence: 'Missing required field: targetSymbol (no function, class, or method specified)',
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  }

  if (!report.reproductionCode || typeof report.reproductionCode !== 'string' || report.reproductionCode.trim().length === 0) {
    return {
      gate: 'G0_SCHEMA',
      passed: false,
      verdict: 'INDETERMINATE',
      evidence: 'Missing reproductionCode: reports without runnable reproduction logic cannot be verified',
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  }

  return {
    gate: 'G0_SCHEMA',
    passed: true,
    verdict: 'INDETERMINATE', // G0 alone does not verify, it only admits to G1
    evidence: `Schema valid: target ${report.targetFile}#${report.targetSymbol} with ${report.reproductionCode.length} chars of reproduction logic`,
    durationMs: Number((performance.now() - start).toFixed(2))
  };
}
