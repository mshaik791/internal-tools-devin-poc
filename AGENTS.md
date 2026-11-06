# Internal tools conventions
Stack: Next.js App Router (TypeScript), Prisma + Postgres, shadcn/ui, Vitest, Playwright. pnpm, not npm.
Monorepo: /packages/core is shared; /apps/<tool> is one tool. Apps import core; apps never import apps.
Permissions: every app declares role x resource x action in permissions.ts as data. Core middleware enforces default DENY.
Audit: every mutation calls core audit() -> append-only audit_log (actor, action, entity, before, after, request_id, ts). The app DB role has INSERT only on audit_log; no UPDATE or DELETE.
Lifecycle: entities with states use core StateMachine; transitions are declared, never ad hoc. Every transition requires a reason string.
Secrets: never in code. Read from env. Dev uses the mock OIDC provider and seed data only.
Done means: Prisma migration, seed, permissions tests, state-transition tests, one Playwright smoke test, README with run steps, PR description listing anything ambiguous in the spec.
Do not modify /packages/core when scaffolding an app. If core is missing something, stop and say so in the PR.
