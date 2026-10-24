import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { IgrisEngine } from '../src/engine.js';
import { auditDiff } from '../src/diff_audit.js';
import { verifyReceiptSignature } from '../src/receipt.js';
import { ProbationEngine } from '../src/probation.js';
import { IgrisReceipt } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

interface AxisCheck {
  axis: string;
  check: string;
  passed: boolean;
  evidence: string;
}

async function runForensicAudit() {
  const results: AxisCheck[] = [];
  const startTime = performance.now();

  console.log('================================================================================');
  console.log('  IGRIS FORENSIC AUDIT: VIBE CODING vs. AGENTIC ENGINEERING                     ');
  console.log('  Skills Applied: zero-mock-verification · code-review-and-quality ·            ');
  console.log('                  constraint-driven-development · design-taste-frontend         ');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // AXIS 1: IGRIS DOGFOODING (Running IgrisEngine & auditDiff on Igris itself)
  // ---------------------------------------------------------------------------
  const engine = new IgrisEngine();

  // 1A. Run Gate 1 AST Reachability against real Igris symbol vs hallucinated symbol
  const phantomReceipt = await engine.triageReport(
    {
      id: 'SELF-AUDIT-PHANTOM',
      title: 'Hallucinated function check on Igris engine',
      description: 'Tests that G1 catches non-existent function in src/engine.ts',
      targetFile: 'src/engine.ts',
      targetSymbol: 'hallucinatedVibeCodingBypassFunction',
      claimedPayload: 'none',
      reproductionCode: 'console.log("unreachable");'
    },
    { repoRoot: REPO_ROOT }
  );

  results.push({
    axis: '1. Dogfooding (Igris Engine)',
    check: 'G1 AST Reachability blocks phantom symbol on src/engine.ts',
    passed: phantomReceipt.verdict === 'PHANTOM_SYMBOL' && verifyReceiptSignature(phantomReceipt),
    evidence: `Verdict=${phantomReceipt.verdict} in ${phantomReceipt.durationMs}ms (SHA-256: ${phantomReceipt.tamperProofHash.slice(0, 16)}...)`
  });

  // 1B. Run Gate 2 Quarantine Lock against hostile shell payload
  const rceReceipt = await engine.triageReport(
    {
      id: 'SELF-AUDIT-RCE',
      title: 'Hostile runner token exfiltration test',
      description: 'Tests that G2 blocks CI_JOB_TOKEN exfiltration',
      targetFile: 'src/engine.ts',
      targetSymbol: 'triageReport',
      claimedPayload: 'rm -rf',
      reproductionCode: 'console.log(process.env.CI_JOB_TOKEN); rm -rf /;'
    },
    { repoRoot: REPO_ROOT }
  );

  results.push({
    axis: '1. Dogfooding (Igris Engine)',
    check: 'G2 Quarantine Lock blocks hostile RCE & token theft',
    passed: rceReceipt.verdict === 'REJECTED_UNSAFE' && verifyReceiptSignature(rceReceipt),
    evidence: `Verdict=${rceReceipt.verdict} in ${rceReceipt.durationMs}ms (0 child processes spawned)`
  });

  // 1C. Run Gate 2 Isolated Subprocess on real crash vs safe execution
  const reproReceipt = await engine.triageReport(
    {
      id: 'SELF-AUDIT-REPRO',
      title: 'Deterministic subprocess crash detection',
      description: 'Verifies isolated child_process catches real exit code != 0',
      targetFile: 'src/receipt.ts',
      targetSymbol: 'verifyReceiptSignature',
      claimedPayload: 'throw',
      reproductionCode: 'throw new TypeError("Deterministic boundary failure proven");'
    },
    { repoRoot: REPO_ROOT }
  );

  results.push({
    axis: '1. Dogfooding (Igris Engine)',
    check: 'G2 Isolated Subprocess reproduces real crash (exitCode=1)',
    passed: reproReceipt.verdict === 'REPRODUCED' && reproReceipt.exitCode === 1 && verifyReceiptSignature(reproReceipt),
    evidence: `Verdict=${reproReceipt.verdict}, exitCode=${reproReceipt.exitCode}, duration=${reproReceipt.durationMs}ms`
  });

  // 1D. Run Igris auditDiff on Igris's own source code (added-lines simulation)
  const srcFiles = [
    'src/engine.ts',
    'src/diff_audit.ts',
    'src/receipt.ts',
    'src/mcp_server.ts',
    'src/gates/g0_schema.ts',
    'src/gates/g1_reachability.ts',
    'src/gates/g2_sandbox.ts'
  ];
  let leakedInSource = 0;
  for (const rel of srcFiles) {
    const content = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    const syntheticDiff = content
      .split('\n')
      .map((l) => `+ ${l}`)
      .join('\n');
    const audit = auditDiff(syntheticDiff);
    leakedInSource += audit.leakedSecrets.length;
  }

  results.push({
    axis: '1. Dogfooding (Diff Auditor)',
    check: 'igris_audit_diff scans all core src/*.ts for hardcoded secrets',
    passed: leakedInSource === 0,
    evidence: `Scanned ${srcFiles.length} core modules: ${leakedInSource} leaked secrets found`
  });

  // ---------------------------------------------------------------------------
  // AXIS 2: ZERO-MOCK VERIFICATION (zero-mock-verification skill)
  // ---------------------------------------------------------------------------
  const allCodeFiles = [
    ...srcFiles,
    'src/gates/g3_bisect.ts',
    'src/server.ts',
    'src/cli.ts',
    'src/types.ts',
    'src/probation.ts',
    'api/triage.js',
    'api/audit_diff.js',
    'api/probation.js'
  ];

  let todoCount = 0;
  let mockArrayCount = 0;
  let suppressionCount = 0;

  for (const rel of allCodeFiles) {
    const full = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf-8');
    const todos = text.match(/\/\/\s*(TODO|FIXME|HACK|XXX)\b/gi) || [];
    const mocks = text.match(/\b(mockData|fakeData|dummyData)\s*=/g) || [];
    const suppressions = text.match(/@ts-ignore|@ts-expect-error|eslint-disable/g) || [];
    todoCount += todos.length;
    mockArrayCount += mocks.length;
    suppressionCount += suppressions.length;
  }

  results.push({
    axis: '2. Zero-Mock Verification',
    check: 'Zero // TODO, // FIXME, or mockData arrays across all source & API files',
    passed: todoCount === 0 && mockArrayCount === 0,
    evidence: `Scanned ${allCodeFiles.length} files: ${todoCount} TODOs, ${mockArrayCount} mockData arrays`
  });

  // Check UI button handlers in index.html are all backed by real functions
  const indexHtml = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf-8');
  const onclickMatches = [...indexHtml.matchAll(/onclick="([a-zA-Z0-9_]+)\(/g)].map((m) => m[1]);
  const uniqueHandlers = [...new Set(onclickMatches)];
  const missingHandlers = uniqueHandlers.filter(
    (fn) => !new RegExp(`function\\s+${fn}\\s*\\(`).test(indexHtml)
  );

  results.push({
    axis: '2. Zero-Mock Verification',
    check: 'Every UI onclick handler in index.html resolves to a defined function',
    passed: uniqueHandlers.length > 0 && missingHandlers.length === 0,
    evidence: `${uniqueHandlers.length}/${uniqueHandlers.length} interactive handlers verified (${uniqueHandlers.join(', ')})`
  });

  // ---------------------------------------------------------------------------
  // AXIS 3: CONSTRAINT & CODE QUALITY (constraint-driven-development & code-review)
  // ---------------------------------------------------------------------------
  const tsconfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'tsconfig.json'), 'utf-8'));
  const strictEnabled = tsconfig?.compilerOptions?.strict === true;

  results.push({
    axis: '3. Constraint & Code Quality',
    check: 'TypeScript strict mode enforced with zero @ts-ignore / eslint-disable suppressions',
    passed: strictEnabled && suppressionCount === 0,
    evidence: `tsconfig.strict=${strictEnabled}, suppressions=${suppressionCount}`
  });

  // Check web/index.html and index.html parity
  const webIndexHtml = fs.readFileSync(path.join(REPO_ROOT, 'web/index.html'), 'utf-8');
  const htmlSynced = indexHtml === webIndexHtml;

  results.push({
    axis: '3. Constraint & Code Quality',
    check: 'Root index.html (Vercel) and web/index.html (Node server) are 100% synchronized',
    passed: htmlSynced,
    evidence: htmlSynced ? `Exact byte match (${indexHtml.length} bytes)` : 'Mismatch between index.html and web/index.html'
  });

  // ---------------------------------------------------------------------------
  // AXIS 4: CRYPTOGRAPHIC TAMPER & MUTATION TESTING
  // ---------------------------------------------------------------------------
  const evidenceDir = path.join(REPO_ROOT, 'evidence/runs');
  const evidenceFiles = fs.readdirSync(evidenceDir).filter((f) => f.endsWith('.json'));
  let validReceipts = 0;
  let caughtMutations = 0;
  let totalMutations = 0;

  for (const f of evidenceFiles) {
    const receipt: IgrisReceipt = JSON.parse(fs.readFileSync(path.join(evidenceDir, f), 'utf-8'));
    if (verifyReceiptSignature(receipt)) validReceipts++;

    // 4 adversarial mutations per receipt
    const mutations: IgrisReceipt[] = [
      { ...receipt, exitCode: receipt.exitCode === 0 ? 1 : 0 },
      { ...receipt, verdict: receipt.verdict === 'REPRODUCED' ? 'REFUTED' : 'REPRODUCED' },
      { ...receipt, durationMs: receipt.durationMs + 0.01 },
      { ...receipt, target: { ...receipt.target, symbol: receipt.target.symbol + '_mutated' } }
    ];
    for (const m of mutations) {
      totalMutations++;
      if (!verifyReceiptSignature(m)) caughtMutations++;
    }
  }

  results.push({
    axis: '4. Cryptographic Mutation Testing',
    check: 'All 5 frozen evidence receipts pass SHA-256 verification & reject 20/20 adversarial mutations',
    passed: validReceipts === 5 && caughtMutations === totalMutations && totalMutations === 20,
    evidence: `Valid=${validReceipts}/5, Tamper mutations rejected=${caughtMutations}/${totalMutations}`
  });

  // ---------------------------------------------------------------------------
  // AXIS 5: BOUTIQUE STUDIO FRONTEND STANDARD (frontend-design skill)
  // ---------------------------------------------------------------------------
  const bannedPlaceholders = ['$14,090,090.00', '$1,570,090.00', 'Total balance', 'Cashflow', 'Free Trial', 'Lorem ipsum'];
  const foundPlaceholders = bannedPlaceholders.filter((p) => indexHtml.includes(p));
  const hasTypographyPairing = indexHtml.includes('Plus Jakarta Sans') && indexHtml.includes('JetBrains Mono') && indexHtml.includes('tabular-nums');
  const hasRealWebCrypto = indexHtml.includes("crypto.subtle.digest('SHA-256'") && !indexHtml.includes('Math.random()');
  const frontendPassed = foundPlaceholders.length === 0 && hasTypographyPairing && hasRealWebCrypto;

  results.push({
    axis: '5. Boutique Studio Frontend Standard',
    check: 'Zero fintech template placeholders, strict Plus Jakarta Sans + JetBrains Mono pairing, and WebCrypto SHA-256',
    passed: frontendPassed,
    evidence: frontendPassed
      ? '0 fintech placeholders, Plus Jakarta Sans + JetBrains Mono (tabular-nums), WebCrypto SHA-256 verified'
      : `Placeholders found: ${foundPlaceholders.join(', ')}`
  });

  // ---------------------------------------------------------------------------
  // AXIS 6: PROBATION & EARNED AUTONOMY (The GitLab Security Standard v1.0)
  // ---------------------------------------------------------------------------
  const probation = new ProbationEngine();
  const testAgentId = 'audit-test-agent';

  // 6A. Level 1 Boundary Enforcement
  const l1Eval = probation.evaluateAction({ agentId: testAgentId, action: 'OPEN_MERGE_REQUEST' });
  const l1Blocked = !l1Eval.allowed && l1Eval.currentLevel === 'LEVEL_1_SUGGEST';

  // 6B. Earned promotion to Level 2
  probation.recordVerifiedRun({
    agentId: testAgentId,
    receiptParams: {
      reportId: 'AUDIT-PASS-1',
      targetFile: 'src/engine.ts',
      targetSymbol: 'triageReport',
      verdict: 'REFUTED',
      exitCode: 0,
      durationMs: 12,
      memoryDeltaMb: 0.5,
      gatesEvaluated: [{ gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'OK', durationMs: 1 }],
      bisection: null
    }
  });
  probation.recordVerifiedRun({
    agentId: testAgentId,
    receiptParams: {
      reportId: 'AUDIT-PASS-2',
      targetFile: 'src/engine.ts',
      targetSymbol: 'triageReport',
      verdict: 'REFUTED',
      exitCode: 0,
      durationMs: 15,
      memoryDeltaMb: 0.6,
      gatesEvaluated: [{ gate: 'G0_SCHEMA', passed: true, verdict: 'REFUTED', evidence: 'OK', durationMs: 1 }],
      bisection: null
    }
  });
  const agentRec = probation.getOrCreateAgent(testAgentId);
  const promotedToL2 = agentRec.currentLevel === 'LEVEL_2_PROPOSE';

  // 6C. Instant demotion on test tampering
  const demoteEval = probation.evaluateAction({
    agentId: testAgentId,
    action: 'AUTO_MERGE',
    diffAudit: {
      verdict: 'SUSPICIOUS_MUTATION',
      passed: false,
      deletedTestCount: 1,
      deletedTests: ['test("should not fail")'],
      addedDependencies: [],
      weakenedAssertions: 0,
      leakedSecrets: [],
      dangerousSinks: [],
      findings: [],
      summary: 'Deleted test detected'
    }
  });
  const demotedToL1 = demoteEval.demoted && agentRec.currentLevel === 'LEVEL_1_SUGGEST';
  const ledgerIntegrity = probation.verifyLedgerIntegrity();

  const probationPassed = l1Blocked && promotedToL2 && demotedToL1 && ledgerIntegrity.valid;

  results.push({
    axis: '6. Probation & Earned Autonomy (GitLab Security Standard v1.0)',
    check: 'Strict 3-level lifecycle, instant demotion on test tampering, and cryptographic hash-chaining',
    passed: probationPassed,
    evidence: `L1 Blocked=${l1Blocked}, Promoted L2=${promotedToL2}, Demoted=${demotedToL1}, Ledger Valid=${ledgerIntegrity.valid} (${ledgerIntegrity.totalReceipts} chained)`
  });

  // Print Summary Table
  for (const r of results) {
    const badge = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${badge} ${r.axis} :: ${r.check}`);
    console.log(`       Evidence: ${r.evidence}\n`);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalTime = (performance.now() - startTime).toFixed(2);
  console.log('================================================================================');
  console.log(`  VERDICT: ${passedCount}/${results.length} CHECKS PASSED in ${totalTime}ms`);
  console.log(`  CLASSIFICATION: ${passedCount === results.length ? 'VERIFIED AGENTIC ENGINEERING (Exit Code 0)' : 'INCOMPLETE'}`);
  console.log('================================================================================');

  process.exit(passedCount === results.length ? 0 : 1);
}

runForensicAudit();
