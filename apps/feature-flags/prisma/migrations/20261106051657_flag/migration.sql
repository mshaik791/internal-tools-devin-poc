-- CreateEnum
CREATE TYPE "FlagEnv" AS ENUM ('staging', 'prod');

-- CreateEnum
CREATE TYPE "FlagState" AS ENUM ('off', 'on', 'percentage');

-- CreateTable
CREATE TABLE "flag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "env" "FlagEnv" NOT NULL,
    "state" "FlagState" NOT NULL DEFAULT 'off',
    "percentage" INTEGER,
    "owner" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flag_env_key_idx" ON "flag"("env", "key");

-- CreateIndex
CREATE UNIQUE INDEX "flag_key_env_key" ON "flag"("key", "env");

-- percentage is 1-99 and present exactly when state = 'percentage'
ALTER TABLE "flag" ADD CONSTRAINT "flag_percentage_range" CHECK ("percentage" BETWEEN 1 AND 99);
ALTER TABLE "flag" ADD CONSTRAINT "flag_percentage_iff_state" CHECK (("state" = 'percentage') = ("percentage" IS NOT NULL));
