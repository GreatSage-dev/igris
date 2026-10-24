# IGRIS

### The knight at the gate. AI bug reports and AI patches are guilty until reproduced.

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-19%2F19%20passing-2FA46A.svg)](src/probation.test.ts)
[![Evidence](https://img.shields.io/badge/evidence-5%2F5%20re--verified-5BA4FF.svg)](evidence/runs/)
[![GitLab Issue #989](https://img.shields.io/badge/GitLab-Issue%20%23989%20Answered-FC6D26.svg?logo=gitlab)](https://gitlab.com/gitlab-org/gitlab/-/issues/989)
[![GitLab Security Standard](https://img.shields.io/badge/GitLab-Security%20Standard%20v1.0-E24329.svg?logo=gitlab)](https://about.gitlab.com/gitlab-security-standard/)
[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run%20Ready-4285F4.svg?logo=googlecloud)](Dockerfile)

Built for the **GitLab "Transcend: Life After Code"** Hackathon (with Google Cloud & Anthropic).  
[ **Interactive Cockpit** ](web/index.html) · [ **What IGRIS Does** ](#what-igris-does) · [ **Watch It Refuse** ](#watch-it-refuse) · [ **Probation** ](#probation-earned-trust-across-runs) · [ **Verify in 5 Seconds** ](#verify-it-yourself-in-5-seconds) · [ **The Honest Table** ](#the-honest-table)

---

## The person this is for

A maintainer opens their inbox.

Forty security reports arrived overnight.  
Each one sounds like an expert wrote it.  
Most name functions that do not exist.

This is already happening. On January 31, 2026, Daniel Stenberg ended curl's seven-year bug bounty after valid reports dropped below 5% under a flood of AI-written submissions ([curl PR #20312](https://github.com/curl/curl/pull/20312)).

GitLab's 2026 AI Accountability Report (Harris Poll, 1,528 developers and tech buyers) found that **85% agree AI moved the bottleneck from writing code to reviewing and validating it**.

Humans cannot read faster.  
So IGRIS checks first, refuses what is fake, and shows its proof.

---

## What IGRIS does

One rule: **nothing is believed until it is reproduced, and the cheapest check runs first.**

```
report or merge request
   │
   ▼
Gate 0   Is it complete?                             under 1 ms
Gate 1   Does the code it names even exist?          ~ 7 ms
Gate 2   Run the test in a locked sandbox.           only the exit code counts
Gate 3   If it crashes, binary-search Git history.   finds the exact commit that broke it
   │
   ▼
Receipt  (sealed, linked to the last run, re-checkable with one command)
```

Each gate can end the run.  
A fake report dies at the first gate that catches it.  
Gates 0 and 1 make **zero model calls** and spawn **zero containers**. Fake work is dropped before it costs maintainer time or GitLab Duo credits.

---

## Watch it refuse

Every row is a recorded run in [`evidence/runs/`](evidence/runs/).  
Targets are seeded fixtures with known faults, not live open-source projects, so any judge can re-verify them in seconds.

| Run | What was thrown at it | What happened | Verdict | Time |
|:----|:----------------------|:--------------|:--------|:-----|
| [`#DDAC45`](evidence/runs/run_02_phantom_symbol_refusal.json) | A report naming a function that does not exist | Stopped at Gate 1 before running anything | `PHANTOM_SYMBOL` | 7.95 ms |
| [`#86811E`](evidence/runs/run_03_injection_attack_blocked.json) | A script containing `; rm -rf / ; cat /etc/passwd` | Blocked before a process could start | `REJECTED_UNSAFE` | 3.82 ms |
| [`#C881D4`](evidence/runs/run_04_ai_slop_false_alarm_refuted.json) | A claimed crash that does not happen | Ran in sandbox, exited cleanly (`code 0`) | `REFUTED` | 184.20 ms |
| [`#04E310`](evidence/runs/run_01_culprit_bisection.json) | A real regression hidden across 16 commits | Reproduced (`code 1`), searched history in 4 steps | `REPRODUCED` (commit `a4f81c9e`) | 142.35 ms |
| [`#4A7AE8`](evidence/runs/run_05_gitlab_duo_mcp_session.json) | An agent commit that broke a billing check | Reproduced (`code 1`), searched history in 3 steps | `REPRODUCED` (commit `7b19a0fc`) | 198.50 ms |

The speed is not the point.  
A plain `git bisect run` also finds a bad commit.  
The point is that every claim meets a judge that is allowed to say **no**, and the "no" comes with proof.

---

## Probation: Earned trust across runs

Checking one run is not enough. An agent that passes five times and cheats on the sixth is still dangerous.

On October 6, 2026, GitLab published **[The GitLab Security Standard v1.0](https://about.gitlab.com/gitlab-security-standard/)**, defining three levels of earned autonomy (*Suggest*, *Propose*, *Act with guardrails*). In [`src/probation.ts`](src/probation.ts), every agent workflow starts on probation, like a new hire:

1. **Level 1 — Suggest:** The agent can only post a suggested fix as a comment. It cannot open a merge request.
2. **Level 2 — Propose:** After **2 clean passes**, the agent can open a merge request, but a human maintainer must approve it (`approvalsRequired: 1`).
3. **Level 3 — Act:** After **5 clean passes** and one sign-off from a named owner, the agent can merge on its own, capped at 5 merges a day.

**Then the test:**  
At Level 3, the agent deletes a test assertion (`- expect(...)`) so its own broken patch passes CI.  
IGRIS catches the deleted test in the diff, blocks the merge, and **demotes the agent back to Level 2 on the spot**. Its streak resets to zero, and its next merge request requires a human again.

Every verdict is linked to the hash of the receipt before it (`previousHash` $\to$ `tamperProofHash`), so no one can quietly rewrite the past.

---

## Why the judge cannot be fooled

The model never grades itself. What an agent says about its own work is never evidence.

| Attack | What stops it | Code |
|:-------|:--------------|:-----|
| A report names code that does not exist | Gate 1 reads the syntax tree of the real file | [`g1_reachability.ts`](src/gates/g1_reachability.ts) |
| A script prints a fake `SUCCESS` | Printed text is ignored. Only the process exit code and signals count | [`g2_sandbox.ts`](src/gates/g2_sandbox.ts) |
| A script tries to read CI secrets (`$CI_JOB_TOKEN`) | Blocked before execution; child processes run with stripped environment variables | [`g2_sandbox.ts`](src/gates/g2_sandbox.ts) |
| An infinite loop | Killed after a hard timeout | [`g2_sandbox.ts`](src/gates/g2_sandbox.ts) |
| A dirty working tree corrupts the commit search | Gate 3 runs in a clean temporary worktree and deletes it after | [`g3_bisect.ts`](src/gates/g3_bisect.ts) |
| An agent patch deletes a test, leaks a key, or adds `eval()` | The diff is checked line by line; any violation blocks the merge and demotes the agent | [`diff_audit.ts`](src/diff_audit.ts), [`probation.ts`](src/probation.ts) |

---

## How it runs inside GitLab & Google Cloud

The entire engine is ~1,500 lines of plain TypeScript with no agent framework dependencies:

1. **MCP Server ([`src/mcp_server.ts`](src/mcp_server.ts) & [`.gitlab/duo-mcp-config.json`](.gitlab/duo-mcp-config.json)):** Exposes five tools to GitLab Duo and Claude: `igris_triage_report`, `igris_bisect_history`, `igris_audit_diff`, `igris_probation_status`, and `igris_evaluate_action`.
2. **Duo Flow ([`.gitlab/duo-flows/triage-and-bisect.yml`](.gitlab/duo-flows/triage-and-bisect.yml)):** Triggers on new issues and merge requests, runs the gates, checks the diff, and sets the branch approval count from the agent's Probation level.
3. **GitLab CI ([`.gitlab-ci.yml`](.gitlab-ci.yml)):** Runs the 19-test suite, re-verifies all 5 chained receipts, and runs the self-audit on every push.
4. **Google Cloud Run ([`Dockerfile`](Dockerfile) & [`cloudbuild.yaml`](cloudbuild.yaml)):** Packages the HTTP server and interactive cockpit in a non-root Node 22 container on port `8080`.

---

## Verify it yourself in 5 seconds

```bash
git clone https://github.com/GreatSage-dev/igris.git
cd igris
npm test                 # runs 19 tests (gates, diff audit, probation promotion & demotion)
npm run reverify         # re-checks all 5 receipts and their hash chain links
npm run audit:agentic    # runs 11 self-audit checks across the codebase
npm run serve            # opens the interactive cockpit at http://localhost:3000
```

---

## The honest table

**Real, and checked by tests or evidence files**
- Gates 0 to 3, the diff checker, and the 3-level Probation state machine (`19/19` tests passing, exit code 0).
- All 5 receipts in [`evidence/runs/`](evidence/runs/) are hash-chained and checked by `npm run reverify`.
- The interactive cockpit ([`index.html`](index.html)) runs real SHA-256 checks in the browser and talks to [`src/server.ts`](src/server.ts).

**Simplified**
- Evidence targets are seeded fixtures with known faults so every run is fast and repeatable offline.
- The sandbox is an OS subprocess with stripped environment variables and a kill timeout; in multi-tenant production, the container runs inside Google Cloud Run's gVisor sandbox.
- A receipt's seal is a SHA-256 hash chain. It catches edits or out-of-order runs, but a production deployment should sign receipts with a private key held in CI secrets.

**Not built yet**
- Syntax-tree checks for languages beyond TypeScript/JavaScript.
- Bisection across flaky tests where a commit passes and fails intermittently.

---

## Where this came from

curl's bug bounty closure above, GitLab's October 6 Security Standard, and a ten-year-old GitLab feature request: **[Issue #989, "Automated git bisect"](https://gitlab.com/gitlab-org/gitlab/-/issues/989)** (opened September 2016).  
IGRIS is a working answer to that request, built for the era of AI-written code.

---

Named after Igris from *Solo Leveling*, the knight who guards the throne and lets no impostor pass.  
MIT © 2026 Promzy ([@GreatSage-dev](https://github.com/GreatSage-dev))
