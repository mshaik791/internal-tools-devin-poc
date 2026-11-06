# Build log

Total: one Devin Cloud session, four tasks, ~15 minutes of Devin work, 6 PRs, $0 on-demand, 1h47m from empty repo to last merge.

Devin plan: Pro ($20/mo). On-demand balance available, unused. Stopwatch started 8:05 PM.

| Task | What | Start | End | Cost | Fixed by me | Note |
|---|---|---|---|---|---|---|
| 1 | core + KYC queue | 8:31 PM | 8:41 PM | $0 on-demand; 23% of Pro daily quota | role-creation race in migration; stopped a history rewrite; declined browser recording | 7m25s + 1m48s of Devin work. +5096 lines, 101 files, 3 commits. 299 unit tests, 6 DB integration, 1 Playwright smoke, all green. CI check job passed on both pushes; only red is GitGuardian on the dev password in early commits, fixed by moving to .env.example. 12 spec ambiguities listed in the PR with resolutions. App commit needed no changes to core. |
| 2 | feature-flags from same skill | 9:12 PM | 9:17 PM | $0 on-demand | 0 lines | 2m32s of Devin work (1m04 + 1m28), ~5 min wall. 46 files, +1467 lines, 0 changes to core. 109 unit, 5 DB integration, Playwright smoke; CI green incl. GitGuardian. 10 spec ambiguities listed. Devin flagged that core's mock IdP only seeds the KYC roles and stopped instead of editing core or working around it in the app. AGENTS.md rule held. |
| 2b | core: mock IdP takes users from the app | 9:22 PM | 9:24 PM | $0 on-demand | 0 lines | Explicitly authorized core change. 1m37s of Devin work. Two PRs, stacked so PR #2 stayed untouched: #3 core (+139 -20, only src/auth + tests + README) and #4 feature-flags users + engineer smoke test (+175 -42). Read the core diff line by line: defensive copies, duplicate/empty sub rejection, production guard pushed into the adapter methods, 87 lines of tests. Approved with no changes. One thing I'd tighten later: an app that forgets to pass users silently gets the KYC defaults. |
| 3 | maintenance ticket: escalation_category (GitHub issue, not a prompt) | 9:43 PM | 9:50 PM | $0 on-demand | 0 lines | 1m22s of Devin work. I wrote this one as a GitHub issue the way a compliance person actually would, and just pointed Devin at it. No prompt. PR #6 came back with the migration for escalation_category, validation, a picker in the escalate flow, the category on the audit row, and the tests updated to match. Merged it without touching anything. |

## Local verification of task 1 (me, on the PR branch, 8:53-9:00 PM)

- analyst sees US-WEST only (14 of 40); KYC-0020 (US-EAST) as analyst -> 404: PASS
- escalate writes audit row with before/after/reason/request id; analyst then sees "no transitions available"; senior can approve; audit shows both rows: PASS
- UPDATE on audit_log as app_rw -> "ERROR: permission denied for table audit_log": PASS
- pnpm test: 299 passed (198 core, 84 kyc-queue, 17 template): PASS

## Local verification of task 2 (me, on main after merging #3, #2, #4, 9:32-9:36 PM)

- feature-flags on :3002. Still logged in as senior_reviewer from the KYC cookie -> 403 "you do not have access to feature flags." A KYC role doesn't leak into another app; default deny held across apps: PASS
- engineer: staging flags editable with a reason, prod flags read only; opening a prod flag shows "no transitions available": PASS
- engineer turned fast-payouts staging on with a reason; audit row has actor, before/after, reason, request id: PASS
- buttons change per state (off -> Turn on / Roll out %, on -> Turn off only): PASS

## Local verification of task 3 (me, on main after merging #6)

- fresh DB, escalate KYC-0013 as analyst with a reason -> picker shows up, pick Identity mismatch, escalate again: PASS
- the audit row for that escalate has the category next to the reason and request id: PASS
- pnpm test: 426 passed: PASS

## Interventions

- Task 1, 8:39 PM. CI went red because GitGuardian flagged the local dev Postgres password in docker-compose. Devin started weighing whether to rewrite the PR branch history to make the scanner pass. I told it not to: a scanner hit on a dev-only credential is a config fix (move to .env.example, read from env), not a history rewrite. Force-pushing to hide something from a scanner is the habit you least want an agent picking up in a fintech repo. Devin complied, made one small commit, and correctly reported there was no real CI failure underneath.
- Task 1, 8:39 PM. Devin offered to run and record a browser test of the full flow. Declined; I'll screen-record it myself.
- Task 1 review, 8:48 PM. `pnpm dev` failed on a fresh machine with "role app_rw already exists." Devin had guarded CREATE ROLE with IF NOT EXISTS, which is right, but the dev script runs two apps' migrations in parallel against one Postgres server, and roles are cluster-scoped: both checked, both created, second one lost the race. Passed on Devin's VM by timing. Fixed by catching duplicate_object/unique_violation inside the block. A correct guard that isn't concurrency-safe on a security primitive is exactly what the human gate on core is for.
- Task 1 review, 8:51 PM. Not a Devin fault: a Homebrew Postgres on my Mac was already on 5432, so the first migrations went into the wrong server. Stopped it. Added a line to the README.
- 9:12 PM. Started the feature-flags task before PR #1 was merged. Devin found core on the open PR branch and built against it, so the run was valid. The ordering was my mistake, not Devin's.
- Task 2, 9:20 PM. Devin asked how core should handle the engineer and viewer users instead of guessing. I picked the option that mirrors production (apps supply users to the IdP adapter) and authorized a scoped core change.

## Things Devin did better than expected

- Read AGENTS.md and the Skill before touching code.
- Listed 12 (then 10) ambiguities in half-page specs and resolved each explicitly in the PR description instead of guessing silently.
- Caught and corrected a wrong line in its own PR description (claimed a prisma.config.ts that didn't exist).
- 299 tests on a first pass, including the full permissions matrix.
- Saved the Node 22 + pnpm setup for future sessions without being asked.
- Hit a limit in core while building app #2, stopped, and asked, rather than editing core or hacking around it.
- When authorized to change core, split the work into a core PR and an app PR stacked on #2 so #2 itself stayed untouched, and planned the merge order.
- Prod flags read-only for engineers and per-state transition buttons came straight from the spec with no extra prompting.
- Task 3 was a plain GitHub issue, no prompt at all. Still came back mergeable.

## Governance notes picked up along the way

- Devin has a per-message on-demand spend cap ($20 default) that an org admin sets.
- Devin keeps a per-user memory; it recorded "No PR history rewrites" after I told it once.