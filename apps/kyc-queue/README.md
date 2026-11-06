# KYC review queue

Built from `specs/kyc-queue.md` with the `new-internal-tool` skill. http://localhost:3001

## Run

From the repo root:

```bash
pnpm install
pnpm dev                                   # postgres, migrate, seed, run apps
pnpm --filter @internal/kyc-queue test     # unit: permissions matrix, state machine, region scope, seed
pnpm --filter @internal/kyc-queue test:db  # integration vs Postgres as app_rw (needs `pnpm dev` / `db:setup` first)
pnpm --filter @internal/kyc-queue exec playwright install chromium   # once
pnpm --filter @internal/kyc-queue test:e2e # resets + reseeds the kyc_queue DB, then runs the Playwright smoke test
pnpm --filter @internal/kyc-queue db:reset # drop, migrate, reseed
```

Sign in as `analyst` (US-WEST only), `senior` (senior_reviewer, all regions) or `admin` (assignments).

## Where things live

| Concern | File |
|---|---|
| role × resource × action | `src/permissions.ts` |
| States, transitions, roles per transition | `src/kyc/machine.ts` (`transitionsFor()` drives the detail-page buttons) |
| Region scoping (`caseScope`) applied to every query | `src/kyc/regions.ts`, `src/kyc/cases.ts` |
| Transition / assign + `audit()` in one DB transaction | `src/kyc/cases.ts` |
| API | `GET /api/cases/:id`, `POST /api/cases/:id/transition {to, reason, escalationCategory?}` (`escalationCategory`: `fraud` | `sanctions` | `identity_mismatch`, required when `to` = `escalated`, rejected otherwise), `POST /api/cases/:id/assign {assignedTo, reason}`, `GET /api/audit?caseId=` |
| Seed (40 cases, 10 overdue, skipped if data exists) | `prisma/seed.ts` |

Status codes: 401 no session, 403 role not permitted, 404 case missing or outside your regions, 400 empty reason or missing/invalid/unexpected `escalationCategory`, 409 undeclared transition or concurrent change.
