#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { IgrisEngine } from './engine.js';
import { formatReceiptMarkdown } from './receipt.js';
import { startMcpServer } from './mcp_server.js';
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === '--help' || command === '-h') {
        console.log(`
🛡️ IGRIS - The Silent Gatekeeper (GitLab DevSecOps Triage Engine)

Usage:
  igris verify <report.json> [--repo <path>]    Triage a vulnerability report
  igris mcp                                     Launch Model Context Protocol server
  igris audit <diff.patch>                      Audit an MR diff for deleted tests
    `);
        process.exit(0);
    }
    if (command === 'mcp') {
        await startMcpServer();
        return;
    }
    if (command === 'verify') {
        const reportPath = args[1];
        if (!reportPath || !fs.existsSync(reportPath)) {
            console.error(`Error: Report file not found: ${reportPath}`);
            process.exit(1);
        }
        const repoIndex = args.indexOf('--repo');
        const repoRoot = repoIndex !== -1 && args[repoIndex + 1] ? path.resolve(args[repoIndex + 1]) : process.cwd();
        const raw = fs.readFileSync(reportPath, 'utf-8');
        const report = JSON.parse(raw);
        const engine = new IgrisEngine();
        console.log(`🛡️ Igris: Triaging report "${report.id}" against target ${report.targetFile}...`);
        const receipt = await engine.triageReport(report, { repoRoot });
        console.log('\n' + formatReceiptMarkdown(receipt));
        process.exit(receipt.verdict === 'REPRODUCED' ? 1 : 0);
    }
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map