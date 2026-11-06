#!/usr/bin/env bash
# pnpm dev: start Postgres, migrate + seed every app, then run all apps.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || cp .env.example .env
docker compose up -d --wait

for app in apps/*/; do
  [ -f "$app/prisma/schema.prisma" ] || continue
  [ -f "$app/.env" ] || cp "$app/.env.example" "$app/.env"
done

pnpm -r --filter "./apps/**" run db:setup
exec pnpm -r --parallel --filter "./apps/**" run dev
