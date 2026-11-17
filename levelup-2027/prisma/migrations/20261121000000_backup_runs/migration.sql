-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "objectKey" TEXT,
    "bytes" INTEGER,
    "tables" INTEGER,
    "latestMigration" TEXT,
    "counts" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ,

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupRun_kind_localDate_idx" ON "BackupRun"("kind", "localDate");

-- CreateIndex
CREATE INDEX "BackupRun_startedAt_idx" ON "BackupRun"("startedAt");


-- At most one successful scheduled backup per day, even if two workers race.
CREATE UNIQUE INDEX "BackupRun_one_scheduled_success_per_day" ON "BackupRun"("localDate") WHERE "kind" = 'SCHEDULED' AND "status" = 'SUCCEEDED';
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_kind" CHECK ("kind" IN ('SCHEDULED', 'MANUAL', 'RESTORE_TEST', 'DOWNLOAD'));
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_status" CHECK ("status" IN ('RUNNING', 'SUCCEEDED', 'FAILED'));
