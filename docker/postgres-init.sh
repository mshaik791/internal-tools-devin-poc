#!/bin/sh
# Runs once on a fresh volume. Creates the runtime login role used by apps'
# DATABASE_URL. Table privileges are granted in the Prisma migrations.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v pw="$APP_RW_PASSWORD" <<'SQL'
CREATE ROLE app_rw LOGIN PASSWORD :'pw';
SQL
