# @internal/core

| Import | Exports |
|---|---|
| `@internal/core/auth` | `User`, `Session`, `AuthAdapter`, `MOCK_USERS`, `getAuthAdapter()` (`AUTH_PROVIDER=mock`, refused in production), `hasRegion()` |
| `@internal/core/auth/server` | `getSession()`, `signIn(sub)`, `signOut()`, `getRequestId()` (uses `next/headers`) |
| `@internal/core/middleware` | `createAuthMiddleware({ publicPaths })` — default-deny: redirect to `/login` or 401 for `/api/*`; sets `x-request-id` |
| `@internal/core/permissions` | `definePermissions(policy)` → `{ can(session, resource, action), requirePermission(resource, action) }` |
| `@internal/core/audit` | `audit(entry, db)` — one `INSERT` into `audit_log`; pass the Prisma transaction client |
| `@internal/core/state-machine` | `defineMachine({ states, transitions })` → `transition()`, `allowedTransitions()`, `canTransition()` |

The `audit_log` table and `app_rw` grants are created by the first migration in `apps/_template/prisma/migrations` (each app owns its own database, so every app carries this migration).

Env: `SESSION_SECRET` (>= 32 chars), `AUTH_PROVIDER=mock` in dev.
