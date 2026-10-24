import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { IgrisEngine } from './engine.js';
import { formatReceiptMarkdown } from './receipt.js';
import { runAutomatedBisection } from './gates/g3_bisect.js';
import { auditDiff } from './diff_audit.js';
import { ProbationEngine } from './probation.js';
const engine = new IgrisEngine();
const probation = new ProbationEngine();
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
                },
                {
                    name: 'igris_probation_status',
                    description: 'Queries the agent autonomy level and trust record under The GitLab Security Standard v1.0. Returns current level (Level 1 Suggest, Level 2 Propose, Level 3 Act), clean pass streak, daily merge count, and GitLab branch protection & approval policies.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            agentId: {
                                type: 'string',
                                description: 'Unique identifier for the agent workflow (e.g. gitlab-duo-flow-security)'
                            }
                        },
                        required: ['agentId']
                    }
                },
                {
                    name: 'igris_evaluate_action',
                    description: 'Evaluates whether an agent action (SUGGEST_FIX, OPEN_MERGE_REQUEST, AUTO_MERGE, DEPLOY) is authorized under its earned probation level. If a diff is provided, audits negative space (deleted tests, leaked credentials) and automatically triggers immediate demotion upon violations.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            agentId: {
                                type: 'string',
                                description: 'Unique identifier for the agent workflow'
                            },
                            action: {
                                type: 'string',
                                enum: ['SUGGEST_FIX', 'OPEN_MERGE_REQUEST', 'AUTO_MERGE', 'DEPLOY'],
                                description: 'The requested action to perform'
                            },
                            diffText: {
                                type: 'string',
                                description: 'Optional unified diff of proposed code changes to audit for test tampering or secrets'
                            },
                            humanSignOffProvided: {
                                type: 'boolean',
                                description: 'Whether a verified human maintainer sign-off has been provided'
                            }
                        },
                        required: ['agentId', 'action']
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
        if (name === 'igris_probation_status') {
            const { agentId } = args;
            const record = probation.getOrCreateAgent(agentId || 'default-agent');
            const policy = probation.getGitLabPolicy(record.currentLevel, record.mergesToday);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            agentId: record.agentId,
                            currentLevel: record.currentLevel,
                            consecutiveCleanPasses: record.consecutiveCleanPasses,
                            totalPasses: record.totalPasses,
                            mergesToday: record.mergesToday,
                            gitLabPolicy: policy,
                            violations: record.violations
                        }, null, 2)
                    }
                ]
            };
        }
        if (name === 'igris_evaluate_action') {
            const { agentId, action, diffText, humanSignOffProvided } = args;
            let diffAudit = undefined;
            if (diffText && typeof diffText === 'string') {
                diffAudit = auditDiff(diffText);
            }
            const evaluation = probation.evaluateAction({
                agentId: agentId || 'default-agent',
                action,
                diffAudit,
                humanSignOffProvided: Boolean(humanSignOffProvided)
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(evaluation, null, 2)
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