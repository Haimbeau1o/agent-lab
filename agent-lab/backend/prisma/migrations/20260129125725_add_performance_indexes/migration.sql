-- DropIndex
DROP INDEX "run_records_startedAt_idx";

-- CreateIndex
CREATE INDEX "run_records_runnerId_idx" ON "run_records"("runnerId");

-- CreateIndex
CREATE INDEX "run_records_taskId_status_idx" ON "run_records"("taskId", "status");

-- CreateIndex
CREATE INDEX "run_records_taskType_status_idx" ON "run_records"("taskType", "status");

-- CreateIndex
CREATE INDEX "run_records_startedAt_idx" ON "run_records"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "score_records_runId_metric_idx" ON "score_records"("runId", "metric");

-- CreateIndex
CREATE INDEX "score_records_runId_target_idx" ON "score_records"("runId", "target");
