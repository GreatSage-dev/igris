/**
 * Igris - The Silent Gatekeeper
 * Negative-Space & Vibe-Coding Vulnerability Diff Auditor
 *
 * Incorporates Cloudflare Project Glasswing attack classes:
 * 1. Hardcoded Service Role & API Secrets in client/server diffs
 * 2. Dangerous Execution Sinks (eval, child_process shell, raw SQL interpolation)
 * 3. Negative-space Test Erasure (deleting expect, assert, it, test blocks)
 * 4. Assertion Weakening (mutating strict invariants into trivial booleans)
 * 5. Unpinned or Suspicious Dependency Injection
 */
const SECRET_PATTERNS = [
    {
        regex: /\b(sk_live_[0-9a-zA-Z]{24,})\b/,
        type: 'Stripe Live Secret Key',
        severity: 'CRITICAL'
    },
    {
        regex: /\b(ghp_[0-9a-zA-Z]{36,}|github_pat_[0-9a-zA-Z_]{50,})\b/,
        type: 'GitHub Personal Access Token',
        severity: 'CRITICAL'
    },
    {
        regex: /\b(xoxb-[0-9a-zA-Z\-]{20,}|xoxp-[0-9a-zA-Z\-]{20,})\b/,
        type: 'Slack Bot/User Token',
        severity: 'HIGH'
    },
    {
        regex: /\b(AKIA[0-9A-Z]{16})\b/,
        type: 'AWS Access Key ID',
        severity: 'HIGH'
    },
    {
        regex: /\b(sk-(?:ant-api\d\d-[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{20,}))\b/,
        type: 'LLM API Secret Key (OpenAI / Anthropic)',
        severity: 'CRITICAL'
    },
    {
        regex: /(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|PRIVATE_KEY|SECRET_KEY|DATABASE_URL|API_SECRET)\s*[:=]\s*['"`]?[A-Za-z0-9_\-\.\$\/+=]{8,}['"`]?/i,
        type: 'Hardcoded Backend Service Secret',
        severity: 'CRITICAL'
    },
    {
        regex: /postgres(?:ql)?:\/\/[^:]+:[^@\s]+@[^\s'"`]+/i,
        type: 'Hardcoded PostgreSQL Connection String with Credentials',
        severity: 'CRITICAL'
    },
    {
        regex: /mongodb(?:\+srv)?:\/\/[^:]+:[^@\s]+@[^\s'"`]+/i,
        type: 'Hardcoded MongoDB Connection String with Credentials',
        severity: 'CRITICAL'
    }
];
const DANGEROUS_SINK_PATTERNS = [
    {
        regex: /\b(eval\s*\(|new\s+Function\s*\()/,
        type: 'Arbitrary Dynamic Code Execution (eval/Function)',
        severity: 'CRITICAL'
    },
    {
        regex: /\bchild_process\.(exec|execSync)\b|\b(exec|execSync)\s*\(\s*[`'"].*(\$|\+)/,
        type: 'Arbitrary OS Command Execution (child_process shell sink)',
        severity: 'CRITICAL'
    },
    {
        regex: /\bspawn\([^)]*shell:\s*true/,
        type: 'Subprocess Spawned With Shell Enabled',
        severity: 'HIGH'
    },
    {
        regex: /\b(?:query|raw|\$queryRawUnsafe)\s*\(\s*`[^`]*\${/,
        type: 'Raw SQL Interpolation Sink (SQL Injection Risk)',
        severity: 'CRITICAL'
    }
];
export function auditDiff(diffText) {
    const lines = diffText.split('\n');
    const deletedTests = [];
    const addedDeps = [];
    const leakedSecrets = [];
    const dangerousSinks = [];
    const findings = [];
    let weakenedAssertions = 0;
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const lineNumber = i + 1;
        // Skip git diff headers
        if (rawLine.startsWith('---') || rawLine.startsWith('+++') || rawLine.startsWith('@@')) {
            continue;
        }
        // 1. Audit Deleted Lines (-)
        if (rawLine.startsWith('-')) {
            const content = rawLine.substring(1).trim();
            if (content.includes('expect(') ||
                content.includes('assert.') ||
                content.includes('test(') ||
                content.includes('it(')) {
                deletedTests.push(rawLine.trim());
                findings.push({
                    type: 'DELETED_TEST',
                    severity: 'HIGH',
                    detail: `Test assertion deleted from codebase: ${content}`,
                    line: rawLine.trim(),
                    lineNumber
                });
            }
            if (content.includes('toBe(true)') || content.includes('toBeDefined()')) {
                weakenedAssertions++;
                findings.push({
                    type: 'WEAKENED_ASSERTION',
                    severity: 'MEDIUM',
                    detail: `Assertion weakened or removed: ${content}`,
                    line: rawLine.trim(),
                    lineNumber
                });
            }
        }
        // 2. Audit Added Lines (+)
        if (rawLine.startsWith('+')) {
            const content = rawLine.substring(1).trim();
            // Check for leaked secrets
            for (const secretCheck of SECRET_PATTERNS) {
                if (secretCheck.regex.test(content)) {
                    leakedSecrets.push({ line: rawLine.trim(), type: secretCheck.type });
                    findings.push({
                        type: 'LEAKED_SECRET',
                        severity: secretCheck.severity,
                        detail: `Detected leaked credential: ${secretCheck.type}`,
                        line: rawLine.trim(),
                        lineNumber
                    });
                    break; // Avoid duplicate alerts on the same line
                }
            }
            // Check for dangerous execution sinks
            for (const sinkCheck of DANGEROUS_SINK_PATTERNS) {
                if (sinkCheck.regex.test(content)) {
                    dangerousSinks.push({ line: rawLine.trim(), type: sinkCheck.type });
                    findings.push({
                        type: 'DANGEROUS_SINK',
                        severity: sinkCheck.severity,
                        detail: `Detected dangerous execution sink: ${sinkCheck.type}`,
                        line: rawLine.trim(),
                        lineNumber
                    });
                    break;
                }
            }
            // Check for suspicious added dependencies in package.json
            if (content.includes('"dependencies"') ||
                content.includes('"devDependencies"') ||
                /"\s*:\s*"\^?[0-9]/.test(content)) {
                addedDeps.push(rawLine.trim());
                findings.push({
                    type: 'SUSPICIOUS_DEPENDENCY',
                    severity: 'LOW',
                    detail: `New dependency added in package manifest: ${content}`,
                    line: rawLine.trim(),
                    lineNumber
                });
            }
        }
    }
    const hasCriticalVulnerabilities = deletedTests.length > 0 || leakedSecrets.length > 0 || dangerousSinks.length > 0;
    const passed = !hasCriticalVulnerabilities;
    let verdict = 'CLEAN_DIFF';
    if (hasCriticalVulnerabilities) {
        verdict = 'SUSPICIOUS_MUTATION';
    }
    else if (weakenedAssertions > 0 || addedDeps.length > 0) {
        verdict = 'ADVISORY_NOTICE';
    }
    const summaryParts = [];
    if (deletedTests.length > 0) {
        summaryParts.push(`${deletedTests.length} test assertion(s) deleted`);
    }
    if (leakedSecrets.length > 0) {
        summaryParts.push(`${leakedSecrets.length} hardcoded secret(s) detected`);
    }
    if (dangerousSinks.length > 0) {
        summaryParts.push(`${dangerousSinks.length} dangerous execution sink(s) flagged`);
    }
    if (weakenedAssertions > 0) {
        summaryParts.push(`${weakenedAssertions} weakened assertion(s)`);
    }
    if (addedDeps.length > 0) {
        summaryParts.push(`${addedDeps.length} dependency addition(s)`);
    }
    const summary = passed
        ? summaryParts.length === 0
            ? 'Clean diff: zero safety invariants violated.'
            : `Advisory: Diff passed critical checks with notices: ${summaryParts.join(', ')}.`
        : `Rejected diff: ${summaryParts.join(', ')}.`;
    return {
        verdict,
        passed,
        deletedTestCount: deletedTests.length,
        deletedTests,
        addedDependencies: addedDeps,
        weakenedAssertions,
        leakedSecrets,
        dangerousSinks,
        findings,
        summary
    };
}
//# sourceMappingURL=diff_audit.js.map