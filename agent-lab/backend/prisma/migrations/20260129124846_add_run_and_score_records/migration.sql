-- CreateTable
CREATE TABLE "api_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "agent_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "testCases" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "data" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "datasetId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "test_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_runs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_runs_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testRunId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "expected" TEXT,
    "latency" INTEGER NOT NULL,
    "tokenCount" INTEGER,
    "metrics" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_results_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "run_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output" TEXT,
    "errorMessage" TEXT,
    "errorStep" TEXT,
    "errorStack" TEXT,
    "latency" INTEGER NOT NULL,
    "tokens" INTEGER,
    "cost" REAL,
    "trace" TEXT NOT NULL,
    "steps" TEXT,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "runnerId" TEXT NOT NULL,
    "runnerVersion" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "score_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "valueNumber" REAL,
    "valueBoolean" BOOLEAN,
    "valueString" TEXT,
    "target" TEXT NOT NULL,
    "explanation" TEXT,
    "snippets" TEXT,
    "alignment" TEXT,
    "evaluatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "score_records_runId_fkey" FOREIGN KEY ("runId") REFERENCES "run_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "run_records_taskId_idx" ON "run_records"("taskId");

-- CreateIndex
CREATE INDEX "run_records_status_idx" ON "run_records"("status");

-- CreateIndex
CREATE INDEX "run_records_taskType_idx" ON "run_records"("taskType");

-- CreateIndex
CREATE INDEX "run_records_startedAt_idx" ON "run_records"("startedAt");

-- CreateIndex
CREATE INDEX "score_records_runId_idx" ON "score_records"("runId");

-- CreateIndex
CREATE INDEX "score_records_metric_idx" ON "score_records"("metric");

-- CreateIndex
CREATE INDEX "score_records_evaluatorId_idx" ON "score_records"("evaluatorId");
