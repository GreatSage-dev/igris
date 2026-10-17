import fs from 'node:fs';
import path from 'node:path';
import { VulnerabilityReport, GateResult } from '../types.js';

/**
 * Gate 1: Code Reachability & Symbol Existence
 * Checks if the claimed target file and function actually exist in the codebase.
 * Filters out the #1 failure mode identified by curl (Daniel Stenberg):
 * AI models hallucinating non-existent function names and fake code paths.
 */
export function evaluateGate1(report: VulnerabilityReport, repoRoot: string): GateResult {
  const start = performance.now();
  const normalizedPath = report.targetFile.replace(/^[/\\]+/, '');
  const absoluteTarget = path.resolve(repoRoot, normalizedPath);

  // 1. Verify file exists within repo boundaries
  if (!fs.existsSync(absoluteTarget)) {
    return {
      gate: 'G1_REACHABILITY',
      passed: false,
      verdict: 'PHANTOM_SYMBOL',
      evidence: `Target file "${report.targetFile}" does not exist in repository root. AI report hallucinated file path.`,
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  }

  // 2. Read file content and check symbol existence
  try {
    const content = fs.readFileSync(absoluteTarget, 'utf-8');
    const symbol = report.targetSymbol.trim();

    // Regex patterns for JS/TS function, class, interface, type, const/let/var, export
    const patterns = [
      new RegExp(`\\bfunction\\s+${escapeRegex(symbol)}\\b`),
      new RegExp(`\\bclass\\s+${escapeRegex(symbol)}\\b`),
      new RegExp(`\\binterface\\s+${escapeRegex(symbol)}\\b`),
      new RegExp(`\\btype\\s+${escapeRegex(symbol)}\\b`),
      new RegExp(`\\b(?:const|let|var)\\s+${escapeRegex(symbol)}\\s*=`),
      new RegExp(`\\b${escapeRegex(symbol)}\\s*\\(`),
      new RegExp(`\\bexport\\s+(?:default\\s+)?(?:function|class|interface|type|const|let|var)\\s+${escapeRegex(symbol)}\\b`),
      new RegExp(`["']?${escapeRegex(symbol)}["']?\\s*:`) // object property or method
    ];

    const symbolFound = patterns.some((p) => p.test(content));

    if (!symbolFound) {
      return {
        gate: 'G1_REACHABILITY',
        passed: false,
        verdict: 'PHANTOM_SYMBOL',
        evidence: `File "${report.targetFile}" exists, but target symbol "${symbol}" was not found in AST/source. Hallucinated symbol.`,
        durationMs: Number((performance.now() - start).toFixed(2))
      };
    }

    return {
      gate: 'G1_REACHABILITY',
      passed: true,
      verdict: 'INDETERMINATE', // Passed reachability, moves to G2 sandbox
      evidence: `Target symbol "${symbol}" confirmed present in "${report.targetFile}". Ready for sandboxed reproduction.`,
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  } catch (err: any) {
    return {
      gate: 'G1_REACHABILITY',
      passed: false,
      verdict: 'INDETERMINATE',
      evidence: `Failed reading target file: ${err.message}`,
      durationMs: Number((performance.now() - start).toFixed(2))
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
