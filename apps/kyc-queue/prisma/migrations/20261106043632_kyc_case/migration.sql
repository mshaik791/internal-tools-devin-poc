-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'escalated');

-- CreateTable
CREATE TABLE "kyc_case" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'pending',
    "assigned_to" TEXT,
    "sla_due_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_case_region_status_idx" ON "kyc_case"("region", "status");

-- CreateIndex
CREATE INDEX "kyc_case_sla_due_at_idx" ON "kyc_case"("sla_due_at");

-- AddCheck (not modelled by Prisma)
ALTER TABLE "kyc_case" ADD CONSTRAINT "kyc_case_risk_score_range" CHECK ("risk_score" BETWEEN 0 AND 100);
