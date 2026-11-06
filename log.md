# Build log

Devin plan: Pro ($20/mo). On-demand balance available but unused so far. Stopwatch started 20:05.

| Session | What | Start | End | Cost | Fixed by me | Note |
|---|---|---|---|---|---|---|
| 1 | core + KYC queue | 20:31 | 20:41 | $0 on-demand; 23% of Pro daily quota | stopped a history rewrite; declined browser recording | 7m25s + 1m48s of Devin work. +5096 lines, 101 files, 3 commits. 299 unit tests, 6 DB integration tests, 1 Playwright smoke, all green locally. CI check job passed on both pushes; the only red is GitGuardian on the dev password in early commits, fixed by moving it to .env.example (findings to be dismissed as dev-only in the dashboard). 12 spec ambiguities listed in the PR with how each was resolved. The app commit needed no changes to core. |
| 2 | feature-flags from same skill | | | | | |
| 3 | maintenance ticket: escalation_category | | | | | |

Local verification of session 1 (me, on the PR branch): [fill after pnpm dev]
- analyst sees US-WEST only; other-region case URL -> 404:
- escalate writes audit row; escalate hidden and rejected on already-escalated case:
- UPDATE on audit_log as app_rw -> permission denied:
- pnpm test:

## Interventions

- Session 1, 20:39. CI went red because GitGuardian flagged the local dev Postgres password in docker-compose. Devin started weighing whether to rewrite the PR branch history to make the scanner pass. I told it not to: a scanner hit on a dev-only credential is a config fix (move to .env.example, read from env), not a history rewrite. Force-pushing to hide something from a scanner is the habit you least want an agent picking up in a fintech repo. Devin complied, made one small commit, and correctly reported that there was no real CI failure underneath. This is why core and anything touching secrets stays human-reviewed.
- Session 1, 20:39. Devin offered to run and record a browser test of the full flow. Declined; I'll screen-record it myself for the video.

## Things Devin did better than expected

- Read AGENTS.md and the Skill before touching code.
- Listed 12 ambiguities in a half-page spec and resolved each explicitly in the PR description instead of guessing silently.
- Caught and corrected a wrong line in its own PR description (claimed a prisma.config.ts that didn't exist).
- 299 tests on a first pass, including the full permissions matrix.
- Saved the Node 22 + pnpm setup for future sessions without being asked.

## Governance notes picked up along the way

- Devin has a per-message on-demand spend cap ($20 default) that an org admin sets. Worth mentioning to the client as a cost control.