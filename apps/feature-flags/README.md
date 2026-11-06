# Feature flag admin

Built from `specs/feature-flags.md` with the `new-internal-tool` skill. http://localhost:3002

## Run

From the repo root:

```bash
pnpm install
pnpm dev                                      # postgres, migrate, seed, run apps
pnpm --filter @internal/feature-flags test     # unit: permissions matrix, state machine, seed
pnpm --filter @internal/feature-flags test:db  # integration vs Postgres as app_rw (needs `pnpm dev` first)
pnpm --filter @internal/feature-flags exec playwright install chromium   # once
pnpm --filter @internal/feature-flags test:e2e # resets + reseeds the feature_flags DB, runs the Playwright smoke test
pnpm --filter @internal/feature-flags db:reset # drop, migrate, reseed
```

Sign in at `/login` as `engineer` (toggles staging), `admin` (staging + prod) or `viewer` (read only). These mock users are declared in `src/auth.ts` and passed to core with `getAuthAdapter({ users })`.

## Where things live

| Concern | File |
|---|---|
| role × resource × action (`flag_staging` / `flag_prod` toggles) | `src/permissions.ts` |
| States, transitions, roles per env | `src/flags/machine.ts` (`transitionsFor()` drives the inline toggle and detail buttons) |
| Transition + `audit()` in one DB transaction | `src/flags/flags.ts` |
| API | `GET /api/flags/:id`, `POST /api/flags/:id/transition {to, reason, percentage?}`, `GET /api/audit?flagId=` |
| Mock OIDC users | `src/auth.ts` |
| Seed (12 flags = 6 keys × staging/prod, skipped if data exists) | `prisma/seed.ts` |

Status codes: 401 no session, 403 role not permitted (or a prod toggle by a non-admin), 404 unknown flag, 400 empty reason or bad percentage, 409 undeclared transition or concurrent change.
