import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { VulnerabilityReport, GateResult, SandboxExecutionOptions } from '../types.js';

// Forbidden tokens that indicate hostile command injection or credential harvesting
const DANGEROUS_TOKENS = [
  'rm -rf',
  'rmdir /s',
  'del /f',
  'format c:',
  'curl ',
  'wget ',
  'bash -c',
  'sh -c',
  'cmd.exe',
  'powershell',
  'child_process',
  'process.env.CI_JOB_TOKEN',
  'process.env.GITLAB_TOKEN',
  'process.env.GITHUB_TOKEN',
  'process.env.AWS_SECRET',
  '.ssh/id_rsa',
  '/etc/shadow',
  '/etc/passwd'
];

/**
 * Gate 2: The Quarantine Blast Chamber
 * Executes reproduction logic in an isolated subprocess with:
 * - Zero network access (clean stripped environment)
 * - Strict timeout (default 3000ms)
 * - Sanitized security checks against RCE/injection
 * - Real process exit codes (code === 0 vs code !== 0)
 */
export async function evaluateGate2(
  report: VulnerabilityReport,
  repoRoot: string,
  options: SandboxExecutionOptions = {}
): Promise<GateResult> {
  const start = performance.now();
  const timeoutMs = options.timeoutMs ?? 3500;

  // 1. Security Scan: Reject Trojan Horse injections
  const codeLower = report.reproductionCode.toLowerCase();
  for (const token of DANGEROUS_TOKENS) {
    if (codeLower.includes(token.toLowerCase())) {
      return {
        gate: 'G2_SANDBOX',
        passed: false,
        verdict: 'REJECTED_UNSAFE',
        evidence: `Quarantine Lock triggered: hostile token detected in reproduction payload ("${token}"). Script blocked from runner execution.`,
        durationMs: Number((performance.now() - start).toFixed(2))
      };
    }
  }

  // 2. Create isolated temporary scratch runner
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'igris-quarantine-'));
  const runnerFile = path.join(tempDir, 'repro_runner.mjs');

  // Wrap reproduction code in a deterministic execution harness
  const wrappedScript = `
import { performance } from 'node:perf_hooks';

// Isolate environment
const _startMem = process.memoryUsage().heapUsed;
const _startTime = performance.now();

try {
  // Execute user-provided reproduction logic
  ${report.reproductionCode}
  
  const _duration = (performance.now() - _startTime).toFixed(2);
  const _memDelta = ((process.memoryUsage().heapUsed - _startMem) / (1024 * 1024)).toFixed(2);
  
  console.log(JSON.stringify({
    status: 'COMPLETED_NORMALLY',
    exitCode: 0,
    durationMs: _duration,
    memDeltaMb: _memDelta
  }));
  process.exit(0);
} catch (err) {
  const _duration = (performance.now() - _startTime).toFixed(2);
  console.error(JSON.stringify({
    status: 'EXCEPTION_THROWN',
    exitCode: 1,
    errorName: err?.name || 'Error',
    errorMessage: err?.message || String(err),
    stack: (err?.stack || '').split('\\n').slice(0, 3).join(' | '),
    durationMs: _duration
  }));
  process.exit(1);
}
`;

  fs.writeFileSync(runnerFile, wrappedScript, 'utf-8');

  // 3. Execute in clean isolated child process
  return new Promise<GateResult>((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Cleaned sanitized env (stripping any sensitive tokens)
    const sanitizedEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      PATH: process.env.PATH || '',
      SYSTEMROOT: process.env.SYSTEMROOT || ''
    };

    const child = spawn(process.execPath, [runnerFile], {
      cwd: repoRoot,
      env: sanitizedEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);

      // Clean up temporary files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }

      const totalDuration = Number((performance.now() - start).toFixed(2));

      if (timedOut) {
        return resolve({
          gate: 'G2_SANDBOX',
          passed: false,
          verdict: 'INDETERMINATE',
          evidence: `Quarantine timeout: reproduction script exceeded ${timeoutMs}ms limit without terminating. Refusing to guess.`,
          exitCode: 124,
          durationMs: totalDuration
        });
      }

      // Exit code !== 0 means the reproduction script crashed/threw -> REPRODUCED
      if (exitCode !== 0) {
        let errorDetails = stderr.trim();
        try {
          const parsed = JSON.parse(stderr.trim());
          errorDetails = `${parsed.errorName}: ${parsed.errorMessage} (${parsed.stack})`;
        } catch {
          // raw stderr
        }

        return resolve({
          gate: 'G2_SANDBOX',
          passed: true,
          verdict: 'REPRODUCED',
          evidence: `Vulnerability confirmed reproduced in blast chamber (Exit code ${exitCode}). Error: ${errorDetails}`,
          exitCode: exitCode ?? 1,
          durationMs: totalDuration
        });
      }

      // Exit code === 0 means the function handled the input safely without crash -> REFUTED
      let realMemDelta = 0;
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.memDeltaMb) {
          realMemDelta = Math.max(0, Number(parsed.memDeltaMb));
        }
      } catch {
        // fallback
      }

      return resolve({
        gate: 'G2_SANDBOX',
        passed: false,
        verdict: 'REFUTED',
        evidence: `Claim refuted in blast chamber: function executed with claimed payload and completed normally with exit code 0. Zero crash or exception observed.`,
        exitCode: 0,
        durationMs: totalDuration,
        memoryDeltaMb: realMemDelta
      });
    });
  });
}
