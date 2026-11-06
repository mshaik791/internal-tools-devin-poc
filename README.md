# Internal tools

pnpm workspaces monorepo. See `AGENTS.md` for conventions and `.agents/skills/new-internal-tool` for scaffolding.

| Path | What |
|---|---|
| `packages/core` | Shared: mock OIDC auth + signed session, permissions (default deny), `audit()`, state machine |
| `apps/_template` | Minimal Next.js app wired to core. Copied by the skill for new tools |
| `apps/<tool>` | One tool per folder, each with its own Postgres database |

## Run locally

Requires Node 22, pnpm 9 (`corepack enable`), Docker.

```bash
pnpm install
pnpm dev        # postgres up -> prisma migrate deploy -> seed -> all apps (template :3000)
pnpm test       # vitest (no DB needed)
pnpm typecheck
```

Sign in at `/login` as one of the mock users: `analyst` (US-WEST), `senior` (senior_reviewer, all regions), `admin`.

## Database roles

- Migrations run as the owner (`MIGRATE_DATABASE_URL`).
- Apps run as `app_rw` (`DATABASE_URL`). The core migration grants it `SELECT, INSERT` on `audit_log` only — no `UPDATE`, `DELETE` or `TRUNCATE`. The dev login password for `app_rw` is set by `docker/postgres-init.sh` on first DB start.
