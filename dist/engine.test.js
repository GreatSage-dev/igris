import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IgrisEngine } from './engine.js';
import { createIgrisMcpServer } from './mcp_server.js';
import { verifyReceiptSignature } from './receipt.js';
import { auditDiff } from './diff_audit.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const engine = new IgrisEngine();
describe('Igris Defense Cascade Tests', () => {
    it('G0: should reject a report with missing schema fields', async () => {
        const malformedReport = {
            id: 'MALFORMED-01',
            title: 'Vague crash'
            // missing targetFile, targetSymbol, reproductionCode
        };
        const receipt = await engine.triageReport(malformedReport, { repoRoot: REPO_ROOT });
        assert.strictEqual(receipt.verdict, 'INDETERMINATE');
        assert.strictEqual(receipt.gatesEvaluated[0].gate, 'G0_SCHEMA');
        assert.strictEqual(receipt.gatesEvaluated[0].passed, false);
    });
    it('G1: should flag hallucinated function names as PHANTOM_SYMBOL', async () => {
        const phantomReport = {
            id: 'PHANTOM-01',
            title: 'Hallucinated function overflow',
            description: 'Claims non-existent function has zero day',
            targetFile: 'src/types.ts',
            targetSymbol: 'nonExistentFictionalFunctionThatDoesNotExist_xyz',
            claimedPayload: '0x1234',
            reproductionCode: 'console.log("running");'
        };
        const receipt = await engine.triageReport(phantomReport, { repoRoot: REPO_ROOT });
        assert.strictEqual(receipt.verdict, 'PHANTOM_SYMBOL');
        assert.strictEqual(receipt.gatesEvaluated[1].gate, 'G1_REACHABILITY');
        assert.strictEqual(receipt.gatesEvaluated[1].passed, false);
    });
    it('G2: should block malicious Trojan Horse shell injections with REJECTED_UNSAFE', async () => {
        const maliciousReport = {
            id: 'MALICIOUS-01',
            title: 'Zero day with hidden payload',
            description: 'Hidden shell injection in reproduction code',
            targetFile: 'src/types.ts',
            targetSymbol: 'VulnerabilityReport',
            claimedPayload: 'attack',
            reproductionCode: 'const x = "harmless"; rm -rf /; console.log(x);'
        };
        const receipt = await engine.triageReport(maliciousReport, { repoRoot: REPO_ROOT });
        assert.strictEqual(receipt.verdict, 'REJECTED_UNSAFE');
        assert.strictEqual(receipt.gatesEvaluated[2].gate, 'G2_SANDBOX');
        assert.strictEqual(receipt.gatesEvaluated[2].passed, false);
    });
    it('G2: should disallow CI token theft in reproduction script', async () => {
        const exfilReport = {
            id: 'EXFIL-01',
            title: 'Token exfiltration attempt',
            description: 'Attempts to read CI_JOB_TOKEN',
            targetFile: 'src/types.ts',
            targetSymbol: 'VulnerabilityReport',
            claimedPayload: 'token leak',
            reproductionCode: 'console.log(process.env.CI_JOB_TOKEN);'
        };
        const receipt = await engine.triageReport(exfilReport, { repoRoot: REPO_ROOT });
        assert.strictEqual(receipt.verdict, 'REJECTED_UNSAFE');
    });
    it('G2: should REFUTE a fake bug report when code executes safely with code 0', async () => {
        const fakeReport = {
            id: 'FAKE-AI-SLOP-01',
            title: 'Claimed parser overflow (curl hallucination sample)',
            description: 'Claims passing empty object crashes types',
            targetFile: 'src/types.ts',
            targetSymbol: 'VulnerabilityReport',
            claimedPayload: '{"safe": true}',
            reproductionCode: `
        // Test that target executes normally
        const obj = { id: 'test', title: 'test' };
        if (!obj.id) throw new Error('Failed');
      `
        };
        const receipt = await engine.triageReport(fakeReport, { repoRoot: REPO_ROOT });
        assert.strictEqual(receipt.verdict, 'REFUTED');
        assert.strictEqual(receipt.exitCode, 0);
        assert.ok(receipt.durationMs < 3000);
    });
    it('G2: should CONFIRM a genuine vulnerability when script throws (exit code != 0)', async () => {
        const realBugReport = {
            id: 'REAL-BUG-01',
            title: 'Buffer boundary assert exception',
            description: 'Real unhandled exception thrown upon malformed input',
            targetFile: 'src/types.ts',
            targetSymbol: 'VulnerabilityReport',
            claimedPayload: 'CRASH_TRIGGER_VALUE',
            reproductionCode: `
        // Intentionally trigger the real flaw
        throw new RangeError("FATAL: Out-of-bounds memory access in buffer parser line 42");
      `
        };
        const receipt = await engine.triageReport(realBugReport, { repoRoot: REPO_ROOT });
        assert.strictEqual(receipt.verdict, 'REPRODUCED');
        assert.strictEqual(receipt.exitCode, 1);
        assert.ok(receipt.remediationSummary);
    });
    it('G2: should handle infinite loops with INDETERMINATE timeout without crashing', async () => {
        const loopReport = {
            id: 'LOOP-01',
            title: 'Infinite loop freeze',
            description: 'Script hangs indefinitely',
            targetFile: 'src/types.ts',
            targetSymbol: 'VulnerabilityReport',
            claimedPayload: 'freeze',
            reproductionCode: 'while(true) {}'
        };
        const receipt = await engine.triageReport(loopReport, {
            repoRoot: REPO_ROOT,
            sandboxOptions: { timeoutMs: 1200 } // Short timeout for test
        });
        assert.strictEqual(receipt.verdict, 'INDETERMINATE');
        assert.strictEqual(receipt.exitCode, 124);
    });
    it('MCP: audit_diff should catch deleted test assertions in MRs', async () => {
        const server = createIgrisMcpServer();
        const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
        const diffWithDeletedTest = `
--- a/test/auth.test.ts
+++ b/test/auth.test.ts
@@ -10,4 +10,2 @@
- expect(user.isAdmin).toBe(false);
- expect(token.isExpired).toBe(false);
+ // Agent deleted failing tests
    `;
        const result = await handler({
            method: 'tools/call',
            params: {
                name: 'igris_audit_diff',
                arguments: { diffText: diffWithDeletedTest }
            }
        });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.passed, false);
        assert.strictEqual(parsed.verdict, 'SUSPICIOUS_MUTATION');
        assert.strictEqual(parsed.deletedTestCount, 2);
    });
    it('MCP: audit_diff should catch leaked credentials in PR diffs (Cloudflare pattern)', async () => {
        const server = createIgrisMcpServer();
        const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
        const fakeStripeLiveKey = ['sk', 'live', '0000000000abcdef12345678'].join('_');
        const fakeSupabaseToken = ['eyJhYmNkZWZnaGlqa2xt', 'bm9wcXJzdHV2d3h5eiI'].join('');
        const diffWithSecret = `
--- a/src/services/billing.ts
+++ b/src/services/billing.ts
@@ -5,2 +5,4 @@
+ const stripeKey = "${fakeStripeLiveKey}";
+ const supabaseKey = "SUPABASE_SERVICE_ROLE_KEY=${fakeSupabaseToken}";
    `;
        const result = await handler({
            method: 'tools/call',
            params: {
                name: 'igris_audit_diff',
                arguments: { diffText: diffWithSecret }
            }
        });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.passed, false);
        assert.strictEqual(parsed.verdict, 'SUSPICIOUS_MUTATION');
        assert.strictEqual(parsed.leakedSecrets.length, 2);
        assert.ok(parsed.summary.includes('hardcoded secret'));
    });
    it('MCP: audit_diff should catch dangerous execution sinks (eval, child_process shell)', async () => {
        const server = createIgrisMcpServer();
        const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
        const diffWithSink = `
--- a/src/routes/execute.ts
+++ b/src/routes/execute.ts
@@ -12,2 +12,4 @@
+ const result = eval(req.body.userCode);
+ child_process.execSync(\`rm -rf \${req.body.tempDir}\`);
    `;
        const result = await handler({
            method: 'tools/call',
            params: {
                name: 'igris_audit_diff',
                arguments: { diffText: diffWithSink }
            }
        });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.passed, false);
        assert.strictEqual(parsed.verdict, 'SUSPICIOUS_MUTATION');
        assert.strictEqual(parsed.dangerousSinks.length, 2);
        assert.ok(parsed.summary.includes('dangerous execution sink'));
    });
    it('MCP: audit_diff should pass clean safe diffs with CLEAN_DIFF', async () => {
        const cleanDiff = `
--- a/src/math.ts
+++ b/src/math.ts
@@ -1,3 +1,4 @@
+ export function multiply(a: number, b: number): number {
+   return a * b;
+ }
    `;
        const audit = auditDiff(cleanDiff);
        assert.strictEqual(audit.passed, true);
        assert.strictEqual(audit.verdict, 'CLEAN_DIFF');
        assert.strictEqual(audit.findings.length, 0);
    });
    it('Receipt: should produce valid tamper-proof SHA-256 hash', async () => {
        const report = {
            id: 'RECEIPT-01',
            title: 'Receipt verification test',
            description: 'Tests hash output',
            targetFile: 'src/types.ts',
            targetSymbol: 'VulnerabilityReport',
            claimedPayload: 'test',
            reproductionCode: 'const a = 1;'
        };
        const receipt = await engine.triageReport(report, { repoRoot: REPO_ROOT });
        assert.ok(receipt.tamperProofHash);
        assert.strictEqual(receipt.tamperProofHash.length, 64); // SHA-256 is 64 hex chars
        assert.ok(receipt.receiptId.startsWith('IGRIS-'));
        // Check signature verification
        assert.strictEqual(verifyReceiptSignature(receipt), true);
        // Check tampered receipt fails signature verification
        const tamperedReceipt = { ...receipt, exitCode: 99 };
        assert.strictEqual(verifyReceiptSignature(tamperedReceipt), false);
    });
    it('MCP: igris_bisect_history should be callable via MCP tool interface', async () => {
        const server = createIgrisMcpServer();
        const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
        const result = await handler({
            method: 'tools/call',
            params: {
                name: 'igris_bisect_history',
                arguments: {
                    repoRoot: REPO_ROOT,
                    goodCommitSha: 'HEAD~1',
                    reproCommand: 'node -e "process.exit(0)"'
                }
            }
        });
        assert.ok(result);
        assert.ok(result.content[0].text);
        const parsed = JSON.parse(result.content[0].text);
        assert.ok('summary' in parsed);
    });
});
//# sourceMappingURL=engine.test.js.map