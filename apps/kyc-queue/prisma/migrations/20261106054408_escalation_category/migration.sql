-- CreateEnum
CREATE TYPE "escalation_category" AS ENUM ('fraud', 'sanctions', 'identity_mismatch');

-- AlterTable
ALTER TABLE "kyc_case" ADD COLUMN     "escalation_category" "escalation_category";
