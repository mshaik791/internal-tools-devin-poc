---
name: new-internal-tool
description: Scaffold a new internal tool under /apps from a spec in /specs, using /packages/core primitives
---
1. Read /specs/<tool>.md. Extract entities, roles, states + transitions, views, seed requirements.
2. Create /apps/<tool> by copying /apps/_template. Do not edit /packages/core.
3. Prisma: add models + migration. Run `pnpm prisma migrate dev` and `pnpm prisma db seed`.
4. permissions.ts: one entry per role x resource x action from the spec. Anything not listed is denied.
5. StateMachine: declare transitions and which roles may perform each.
6. Pages: list view (filters, sort, overdue highlight if an sla field exists), detail view with role-gated transition buttons, audit tab.
7. Tests: permissions matrix, every legal transition and one illegal one, Playwright smoke for the main flow.
8. README for the app. Open a PR titled `feat(<tool>): scaffold from spec` with a checklist of the above and a list of spec ambiguities.
