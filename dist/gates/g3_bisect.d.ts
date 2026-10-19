import { BisectionResult } from '../types.js';
/**
 * Gate 3: Automated Git Bisection Engine
 * Solves GitLab Community Issue #989: "Automated git bisect"
 * When a vulnerability or regression is proven in G2, this engine binary-searches
 * git history to locate the exact commit and author that introduced the flaw.
 */
export declare function runAutomatedBisection(repoRoot: string, goodCommitSha: string, reproCommand: string): BisectionResult | null;
