import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { IgrisEngine } from './engine.js';
import { formatReceiptMarkdown } from './receipt.js';
import { runAutomatedBisection } from './gates/g3_bisect.js';
import { auditDiff } from './diff_audit.js';
const engine = new IgrisEngine();
export function createIgrisMcpServer() {
    const server = new Server({
        name: 'igris-gatekeeper',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    });
    // Expose MCP Tools for GitLab Duo & Anthropic Claude
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: 'igris_triage_report',
                    description: 'Autonomous Vulnerability Verification Gate. Takes an incoming issue/CVE report, evaluates schema, checks code reachability, executes sandboxed reproduction in blast chamber, and produces a deterministic tamper-proof receipt.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            report: {
                                type: 'object',
                                description: 'Vulnerability report with title, description, targetFile, targetSymbol, claimedPayload, reproductionCode',
                                required: ['id', 'title', 'targetFile', 'targetSymbol', 'reproductionCode']
                            },
                            repoRoot: {
                                type: 'string',
                                description: 'Absolute path to repository root'
                            }
                        },
                        required: ['report', 'repoRoot']
                    }
                },
                {
                    name: 'igris_audit_diff',
                    description: 'Audits a Merge Request diff for negative-space safety & vibe-coding vulnerabilities (Zero-Trust Invariant Standard): flags deleted test assertions, leaked service secrets, dangerous execution sinks (eval, child_process), or suspicious new dependencies.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            diffText: {
                                type: 'string',
                                description: 'Raw unified diff of the Merge Request'
                            }
                        },
                        required: ['diffText']
                    }
                },
                {
                    name: 'igris_bisect_history',
                    description: 'Solves GitLab Issue #989: Automatically executes binary search across git commits to pinpoint the exact commit that introduced a test failure or regression.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            repoRoot: { type: 'string', description: 'Absolute path to repository root' },
                            goodCommitSha: { type: 'string', description: 'Known passing commit SHA or tag' },
                            reproCommand: { type: 'string', description: 'Command to run at each commit (e.g. npm test)' }
                        },
                        required: ['repoRoot', 'goodCommitSha', 'reproCommand']
                    }
                }
            ]
        };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        if (name === 'igris_triage_report') {
            const { report, repoRoot } = args;
            const receipt = await engine.triageReport(report, { repoRoot });
            const markdown = formatReceiptMarkdown(receipt);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(receipt, null, 2)
                    },
                    {
                        type: 'text',
                        text: markdown
                    }
                ]
            };
        }
        if (name === 'igris_audit_diff') {
            const { diffText } = args;
            const auditResult = auditDiff(diffText);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(auditResult, null, 2)
                    }
                ]
            };
        }
        if (name === 'igris_bisect_history') {
            const { repoRoot, goodCommitSha, reproCommand } = args;
            const result = runAutomatedBisection(repoRoot, goodCommitSha, reproCommand);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: result !== null,
                            bisection: result,
                            summary: result
                                ? `Automated Git Bisection successfully isolated culprit commit ${result.culpritCommitSha} by ${result.commitAuthor} in ${result.stepsCount} steps.`
                                : 'Bisection completed without isolating an unambiguous culprit commit.'
                        }, null, 2)
                    }
                ]
            };
        }
        throw new Error(`Unknown tool: ${name}`);
    });
    return server;
}
export async function startMcpServer() {
    const server = createIgrisMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=mcp_server.js.map