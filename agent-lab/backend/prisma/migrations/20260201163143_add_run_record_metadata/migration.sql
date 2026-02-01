-- AlterTable
ALTER TABLE "run_records" ADD COLUMN "configHash" TEXT;
ALTER TABLE "run_records" ADD COLUMN "runFingerprint" TEXT;
ALTER TABLE "run_records" ADD COLUMN "configSnapshot" TEXT;
ALTER TABLE "run_records" ADD COLUMN "overrides" TEXT;
ALTER TABLE "run_records" ADD COLUMN "artifacts" TEXT;
ALTER TABLE "run_records" ADD COLUMN "reports" TEXT;
