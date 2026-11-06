-- Core audit log (from @internal/core). Every app's DB starts with this migration.

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ts" TIMESTAMPTZ(6) NOT NULL DEFAULT clock_timestamp(),
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "request_id" TEXT NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_ts_idx" ON "audit_log"("entity", "entity_id", "ts" DESC);

-- Runtime role. Apps connect as app_rw (DATABASE_URL); migrations run as the owner.
-- Login + password are provisioned outside migrations (docker/postgres-init.sh in dev).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rw') THEN
    BEGIN
      CREATE ROLE app_rw NOLOGIN;
    EXCEPTION WHEN duplicate_object OR unique_violation THEN
      -- another migration created it concurrently; fine
      NULL;
    END;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_rw;

-- Append-only: app_rw may read and insert audit rows, never UPDATE/DELETE/TRUNCATE.
REVOKE ALL ON "audit_log" FROM app_rw;
GRANT SELECT, INSERT ON "audit_log" TO app_rw;

-- Tables created by later app migrations get normal CRUD for app_rw.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_rw;
