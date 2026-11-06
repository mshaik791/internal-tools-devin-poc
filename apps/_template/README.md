# Template app

Copied by `.agents/skills/new-internal-tool` to `apps/<tool>`. After copying: rename the package, change the database name in `.env.example`, pick a free port in `dev`/`start`, and replace `permissions.ts`.

```bash
cp .env.example .env
pnpm db:setup   # prisma migrate deploy + seed (DB must be up: `pnpm db:up` at the root)
pnpm dev        # http://localhost:3000
pnpm test
```
