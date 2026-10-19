import { VulnerabilityReport, IgrisReceipt, SandboxExecutionOptions } from './types.js';
export interface TriageOptions {
    repoRoot: string;
    enableBisection?: boolean;
    knownGoodCommitSha?: string;
    reproCommand?: string;
    sandboxOptions?: SandboxExecutionOptions;
}
export declare class IgrisEngine {
    /**
     * Evaluates an incoming vulnerability report through the 4-gate defense cascade.
     */
    triageReport(report: VulnerabilityReport, options: TriageOptions): Promise<IgrisReceipt>;
}
