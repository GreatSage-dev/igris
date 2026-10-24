# IGRIS

### Catch the hallucination. Bisect the commit. Prove it.

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-19%2F19%20passing-2FA46A.svg)](src/probation.test.ts)
[![Evidence](https://img.shields.io/badge/evidence-5%2F5%20chained%20%26%20re--verified-5BA4FF.svg)](evidence/runs/)
[![GitLab Issue #989](https://img.shields.io/badge/GitLab-Issue%20%23989%20Answered-FC6D26.svg?logo=gitlab)](https://gitlab.com/gitlab-org/gitlab/-/issues/989)
[![GitLab Security Standard](https://img.shields.io/badge/GitLab-Security%20Standard%20v1.0-E24329.svg?logo=gitlab)](https://about.gitlab.com/gitlab-security-standard/)
[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run%20Ready-4285F4.svg?logo=googlecloud)](Dockerfile)

Built for the **GitLab "Transcend: Life After Code"** Hackathon (with Google Cloud & Anthropic).  
[ **Interactive Cockpit** ](web/index.html) · [ **Verify in 5 Seconds** ](#verify-it-yourself-in-5-seconds) · [ **Watch It Refuse** ](#watch-it-refuse) · [ **Probation & Earned Autonomy** ](#probation-earned-autonomy-across-runs) · [ **The Honest Table** ](#the-honest-table)

---

## The person this is for

A maintainer opens their inbox.

Forty security reports arrived overnight.  
Each one sounds like an expert wrote it.  
Most name functions that do not exist.

This is already happening. On January 31, 2026, Daniel Stenberg shut down curl's seven-year HackerOne bug bounty after valid submissions dropped below 5% under a flood of AI-generated reports ([curl PR #20312](https://github.com/curl/curl/pull/20312)).

GitLab's 2026 AI Accountability Report (Harris Poll, 1,528 developers and tech leaders) found that **85% agree AI moved the bottleneck from writing code to reviewing and validating it**. Meanwhile, when a real regression does slip onto `main`, engineers still bisect commits by hand—a pain point open in **[GitLab Issue #989 ("Automated git bisect")](https://gitlab.com/gitlab-org/gitlab/-/issues/989)** since September 2016.

Humans cannot read faster.  
So IGRIS runs first, refuses what fails, and shows its proof.

---

## Verify it yourself in 5 seconds

No cloud keys or database setup required:

```bash
git clone https://github.com/GreatSage-dev/igris.git
cd igris
npm test                 # 19/19 deterministic unit & probation tests (exit code 0)
npm run reverify         # re-hashes and checks all 5 chained evidence receipts
npm run audit:agentic    # 11/11 self-audit checks across AST, sandbox, and UI
npm run serve            # opens the interactive cockpit at http://localhost:3000
```

---

## What IGRIS does

One rule: **nothing is believed until it is reproduced, and the cheapest check runs first.**

```
incoming bug report or agent merge request
   │
   ▼
Gate 0   Is the report well-formed?                  < 1 ms    (0 model calls, 0 processes)
Gate 1   Does the function it names even exist?      ~ 7 ms    (TypeScript AST symbol check)
Gate 2   Run the repro in a locked sandbox.          ~ 60 ms   (only OS exit code counts)
Gate 3   If it crashes, binary-search Git history.   ~ 70 ms   (isolates the culprit commit)
   │
   ▼
Diff Audit & Probation Ledger
   • Did the agent's patch delete a test or leak a key?
   • Update the agent's autonomy level (Suggest → Propose → Act, or instant demotion)
   │
   ▼
Chained Receipt  (SHA-256 sealed, re-checkable with `npm run reverify`)
```

Each gate can end the run.  
A hallucinated report dies at Gate 1 in 7 milliseconds. It never spawns a container, never burns GitLab Duo credits, and never reaches an LLM.

---

## Watch it refuse

Every row below is a recorded run in [`evidence/runs/`](evidence/runs/).  
Targets are seeded fixtures with known faults so any judge can re-verify them deterministically.

| Run | What was thrown at it | Gate that stopped or proved it | Verdict | Time | Evidence File |
|:----|:----------------------|:-------------------------------|:--------|:-----|:--------------|
| `#DDAC45` | Report naming a function that does not exist | **Gate 1** (AST symbol check) | `PHANTOM_SYMBOL` | `7.95 ms` | [`run_02_phantom_symbol_refusal.json`](evidence/runs/run_02_phantom_symbol_refusal.json) |
| `#86811E` | Repro script containing `; rm -rf / ; cat /etc/passwd` | **Gate 2** (static quarantine lock) | `REJECTED_UNSAFE` | `3.82 ms` | [`run_03_injection_attack_blocked.json`](evidence/runs/run_03_injection_attack_blocked.json) |
| `#C881D4` | Claimed divide-by-zero crash that executes safely | **Gate 2** (isolated subprocess, exit 0) | `REFUTED` | `184.20 ms` | [`run_04_ai_slop_false_alarm_refuted.json`](evidence/runs/run_04_ai_slop_false_alarm_refuted.json) |
| `#04E310` | Real auth regression hidden across 16 commits | **Gate 3** (4-step `git bisect`) | `REPRODUCED` (`a4f81c9e`) | `142.35 ms` | [`run_01_culprit_bisection.json`](evidence/runs/run_01_culprit_bisection.json) |
| `#4A7AE8` | Agent commit that broke billing idempotency | **Gate 3** (3-step `git bisect`) | `REPRODUCED` (`7b19a0fc`) | `198.50 ms` | [`run_05_gitlab_duo_mcp_session.json`](evidence/runs/run_05_gitlab_duo_mcp_session.json) |

The speed is not the point.  
A plain `git bisect run` also finds a bad commit.  
The point is that every claim meets a gate that is allowed to say **no**, and the "no" comes with a receipt.

---

## Probation: Earned autonomy across runs

On October 6, 2026, GitLab published **[The GitLab Security Standard v1.0](https://about.gitlab.com/gitlab-security-standard/)**, defining three levels of earned autonomy for AI agents (*Suggest*, *Propose*, *Act with guardrails*) and one core rule for the Verify stage: **checks must be ones the actor cannot edit or waive**.

[`src/probation.ts`](src/probation.ts) turns that document into running state:

```
Level 1: SUGGEST (Probation)  ──[ 2 clean passes ]──►  Level 2: PROPOSE (Supervised)
• Comments on issues only                              • Opens Merge Requests
• Cannot open or merge MRs                             • Requires 1 human maintainer approval
                                                              │
                                                  [ 5 clean passes + owner sign-off ]
                                                              │
                                                              ▼
                                                       Level 3: ACT (Guardrailed)
                                                       • Auto-merges up to 5 MRs/day
                                                              │
          ┌───────────────────────────────────────────────────┘
          ▼  [ Agent deletes a test assertion or leaks a secret in an MR diff ]
🛑 INSTANT DEMOTION TO LEVEL 2 (or Level 1)
• Streak reset to 0
• GitLab policy locked: `approvalsRequired` set back to 1
```

Every run in the ledger hashes the previous receipt's seal (`previousHash` $\to$ `tamperProofHash`), so an agent cannot quietly rewrite its history.

---

## Why the judge cannot be fooled

The model never grades itself.

| Attack | What stops it | Code |
|:-------|:--------------|:-----|
| Report names a hallucinated function | Gate 1 parses the TypeScript AST symbol table before running anything | [`src/gates/g1_reachability.ts`](src/gates/g1_reachability.ts) |
| Script prints a fake `SUCCESS` to stdout | Stdout text is ignored for verdicts; only the OS process exit code and signals count | [`src/gates/g2_sandbox.ts`](src/gates/g2_sandbox.ts) |
| Script tries to steal `$CI_JOB_TOKEN` or run shell commands | Static quarantine blocks secret access and shell metacharacters; child env is stripped | [`src/gates/g2_sandbox.ts`](src/gates/g2_sandbox.ts) |
| Infinite loop (`while(true){}`) | Hard timeout kills the process group and marks `INDETERMINATE` | [`src/gates/g2_sandbox.ts`](src/gates/g2_sandbox.ts) |
| Dirty working tree corrupts `git bisect` | Gate 3 runs inside a clean temporary Git worktree and removes it on exit | [`src/gates/g3_bisect.ts`](src/gates/g3_bisect.ts) |
| Agent deletes a test assertion (`- expect(...)`) so its own MR passes | Negative-space diff audit catches deleted tests, leaked keys, and `eval` sinks, triggering instant Probation demotion | [`src/diff_audit.ts`](src/diff_audit.ts), [`src/probation.ts`](src/probation.ts) |

---

## Codebase anatomy (no magic, ~1,500 lines of TypeScript)

There are no multi-agent frameworks or hidden wrappers. You can read the entire engine in one sitting:

| File | Lines | What it does |
|:-----|------:|:-------------|
| [`src/engine.ts`](src/engine.ts) | 111 | Orchestrates the 4-gate cascade (`G0` $\to$ `G3`) with zero LLM calls |
| [`src/gates/g0_schema.ts`](src/gates/g0_schema.ts) | 59 | Validates payload structure and required reproduction fields |
| [`src/gates/g1_reachability.ts`](src/gates/g1_reachability.ts) | 77 | Parses TypeScript AST to verify the target file and symbol exist |
| [`src/gates/g2_sandbox.ts`](src/gates/g2_sandbox.ts) | 199 | Static quarantine scanner + isolated child process runner with stripped env |
| [`src/gates/g3_bisect.ts`](src/gates/g3_bisect.ts) | 67 | Automated `git bisect` binary search inside temporary worktrees (Issue #989) |
| [`src/diff_audit.ts`](src/diff_audit.ts) | 231 | Audits unified MR diffs for deleted tests, leaked secrets, and dangerous sinks |
| [`src/probation.ts`](src/probation.ts) | 376 | 3-level earned autonomy state machine, demotion rules, and hash-chained ledger |
| [`src/receipt.ts`](src/receipt.ts) | 155 | Canonical JSON serialization, SHA-256 sealing, and GitLab Markdown formatting |
| [`src/mcp_server.ts`](src/mcp_server.ts) | 264 | Model Context Protocol (MCP) server exposing 5 tools to GitLab Duo & Claude |

---

## How it runs inside GitLab & Google Cloud

1. **MCP Server ([`src/mcp_server.ts`](src/mcp_server.ts) & [`.gitlab/duo-mcp-config.json`](.gitlab/duo-mcp-config.json)):** Exposes `igris_triage_report`, `igris_bisect_history`, `igris_audit_diff`, `igris_probation_status`, and `igris_evaluate_action` over MCP stdio.
2. **GitLab Duo Flow ([`.gitlab/duo-flows/triage-and-bisect.yml`](.gitlab/duo-flows/triage-and-bisect.yml)):** Declarative workflow triggered on `issue.created` and `merge_request.created` that queries Probation level, runs the 4 gates, bisects regressions, and enforces branch approval rules.
3. **GitLab CI Pipeline ([`.gitlab-ci.yml`](.gitlab-ci.yml)):** 4-stage pipeline (`build`, `test`, `verify`, `bisect`) that runs the 19-test suite, `npm run reverify`, and `npm run audit:agentic` on every push.
4. **Google Cloud Run ([`Dockerfile`](Dockerfile) & [`cloudbuild.yaml`](cloudbuild.yaml)):** Stateless, non-root Node 22 Alpine container exposing the HTTP API and interactive workbench on port `8080`.

---

## The honest table

**Real, and checked by automated tests (`npm test`, `npm run reverify`, `npm run audit:agentic`)**
- Gates 0 through 3, negative-space diff auditing, and the 3-level Probation state machine (`19/19` unit & integration tests passing with exit code 0).
- Hash-chained evidence receipts (`previousHash` $\to$ `tamperProofHash`) across all 5 recorded runs in `evidence/runs/`, re-verified in under 200ms by `npm run reverify`.
- Interactive web cockpit ([`index.html`](index.html)) with real WebCrypto SHA-256 hashing, live server endpoints ([`src/server.ts`](src/server.ts)), and MCP server ([`src/mcp_server.ts`](src/mcp_server.ts)).

**Simplified for deterministic local evaluation**
- The 5 evidence runs target seeded repository fixtures with known faults so any judge can reproduce the exact millisecond timings and commit hashes offline.
- Gate 2 runs untrusted scripts in an isolated OS child process with stripped environment variables and a hard `SIGKILL` timeout; in production multi-tenant deployment, this container runs inside a gVisor-sandboxed Google Cloud Run instance.
- Receipt seals use deterministic SHA-256 hashing over canonical payloads to catch tampering or broken chain links; production deployment adds asymmetric KMS signing so an actor with file write access cannot recompute the chain.

**Next steps beyond this hackathon**
- Multi-language AST reachability (Python `ast` and Go `go/ast` alongside TypeScript).
- Multi-bad-commit bisection weighting for flaky test suites.

---

Named after Igris, the silent knight at the gate who lets no impostor pass.  
MIT © 2026
