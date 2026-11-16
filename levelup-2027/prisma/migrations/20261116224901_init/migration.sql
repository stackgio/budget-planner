-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('DOC_SHIFT', 'OVERTIME_SHIFT', 'ACTIVATION', 'APPOINTMENT', 'WORKOUT', 'STUDY', 'GIG', 'DATE_NIGHT', 'CHURCH', 'CONTENT', 'FINANCIAL', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('NORMAL', 'OVERTIME', 'ACTIVATION', 'RECOVERY');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PayKind" AS ENUM ('REGULAR', 'OVERTIME');

-- CreateEnum
CREATE TYPE "PaydayStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'ZERO', 'SKIPPED');

-- CreateEnum
CREATE TYPE "IncomeKind" AS ENUM ('REGULAR', 'OVERTIME', 'GIG', 'OTHER');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('WORKED', 'SUBMITTED', 'APPROVED', 'EXPECTED', 'RECEIVED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ChallengeKind" AS ENUM ('DEBT', 'MOVING_OUT', 'SCHD');

-- CreateEnum
CREATE TYPE "SelectionRule" AS ENUM ('BIG_FIRST_RANDOM_TOP_N', 'SEQUENTIAL');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('SETUP_REQUIRED', 'ACTIVE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TileStatus" AS ENUM ('OPEN', 'PROVISIONAL', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Gio',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "userAgent" TEXT,
    "method" TEXT NOT NULL DEFAULT 'password',

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passkey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "deviceType" TEXT,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ,

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "wakeTime" TEXT NOT NULL DEFAULT '06:00',
    "bedTime" TEXT NOT NULL DEFAULT '21:30',
    "briefingTime" TEXT NOT NULL DEFAULT '06:00',
    "checkInTime" TEXT NOT NULL DEFAULT '17:00',
    "reflectionTime" TEXT NOT NULL DEFAULT '21:00',

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "category" "EventCategory" NOT NULL,
    "startAt" TIMESTAMPTZ NOT NULL,
    "endAt" TIMESTAMPTZ NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "rrule" TEXT,
    "reminderMin" INTEGER,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventException" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "originalStart" TIMESTAMPTZ NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "startAt" TIMESTAMPTZ,
    "endAt" TIMESTAMPTZ,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "EventException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeSession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "mode" "WorkMode" NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "estimatedEnd" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    "notes" TEXT,
    "eventId" TEXT,

    CONSTRAINT "ModeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" DATE,
    "dueTime" TEXT,
    "rrule" TEXT,
    "reminderMin" INTEGER,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "isTopThree" BOOLEAN NOT NULL DEFAULT false,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "targetPerWeek" INTEGER NOT NULL DEFAULT 7,
    "optional" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitCheckIn" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "HabitCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaySchedule" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "PayKind" NOT NULL,
    "anchorOfficialDate" DATE NOT NULL,
    "anchorVerified" BOOLEAN NOT NULL DEFAULT false,
    "intervalDays" INTEGER NOT NULL DEFAULT 14,
    "earlyDepositOffsetDays" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PaySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payday" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "PayKind" NOT NULL,
    "officialDate" DATE NOT NULL,
    "expectedDepositDate" DATE NOT NULL,
    "manualDepositDate" DATE,
    "holidayNote" TEXT,
    "status" "PaydayStatus" NOT NULL DEFAULT 'EXPECTED',
    "note" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeDeposit" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "IncomeKind" NOT NULL,
    "paydayId" TEXT,
    "netCents" INTEGER NOT NULL,
    "actualDepositDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayRate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "regularHourlyCents" INTEGER NOT NULL,
    "overtimeMultiplierBp" INTEGER NOT NULL,
    "provisional" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeShift" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startAt" TIMESTAMPTZ NOT NULL,
    "endAt" TIMESTAMPTZ NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "regularHoursX100" INTEGER NOT NULL DEFAULT 0,
    "overtimeHoursX100" INTEGER NOT NULL DEFAULT 0,
    "rateHourlyCents" INTEGER NOT NULL,
    "rateMultiplierBp" INTEGER NOT NULL,
    "estimatedGrossCents" INTEGER NOT NULL,
    "isActivation" BOOLEAN NOT NULL DEFAULT false,
    "payrollPeriod" TEXT,
    "paydayId" TEXT,
    "status" "OvertimeStatus" NOT NULL DEFAULT 'WORKED',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OvertimeShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "ChallengeKind" NOT NULL,
    "name" TEXT NOT NULL,
    "selectionRule" "SelectionRule" NOT NULL,
    "topN" INTEGER NOT NULL DEFAULT 10,
    "targetCents" INTEGER,
    "nextNumber" INTEGER,
    "status" "ChallengeStatus" NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeTile" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "TileStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "ChallengeTile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_key_createdAt_idx" ON "LoginAttempt"("key", "createdAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_ownerId_startAt_idx" ON "CalendarEvent"("ownerId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_ownerId_sourceType_sourceId_key" ON "CalendarEvent"("ownerId", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "EventException_eventId_originalStart_key" ON "EventException"("eventId", "originalStart");

-- CreateIndex
CREATE INDEX "ModeSession_ownerId_startedAt_idx" ON "ModeSession"("ownerId", "startedAt");

-- CreateIndex
CREATE INDEX "Task_ownerId_status_dueDate_idx" ON "Task"("ownerId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Habit_ownerId_name_key" ON "Habit"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HabitCheckIn_habitId_date_key" ON "HabitCheckIn"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PaySchedule_ownerId_kind_key" ON "PaySchedule"("ownerId", "kind");

-- CreateIndex
CREATE INDEX "Payday_ownerId_kind_officialDate_idx" ON "Payday"("ownerId", "kind", "officialDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payday_ownerId_kind_officialDate_key" ON "Payday"("ownerId", "kind", "officialDate");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeDeposit_paydayId_key" ON "IncomeDeposit"("paydayId");

-- CreateIndex
CREATE INDEX "PayRate_ownerId_effectiveFrom_idx" ON "PayRate"("ownerId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "OvertimeShift_ownerId_date_idx" ON "OvertimeShift"("ownerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_ownerId_kind_key" ON "Challenge"("ownerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeTile_challengeId_number_key" ON "ChallengeTile"("challengeId", "number");

-- CreateIndex
CREATE INDEX "AuditLog_ownerId_entity_entityId_idx" ON "AuditLog"("ownerId", "entity", "entityId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventException" ADD CONSTRAINT "EventException_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCheckIn" ADD CONSTRAINT "HabitCheckIn_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeDeposit" ADD CONSTRAINT "IncomeDeposit_paydayId_fkey" FOREIGN KEY ("paydayId") REFERENCES "Payday"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeShift" ADD CONSTRAINT "OvertimeShift_paydayId_fkey" FOREIGN KEY ("paydayId") REFERENCES "Payday"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeTile" ADD CONSTRAINT "ChallengeTile_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────── Hand-written invariants (not expressible in Prisma schema) ─────────────

-- At most one open work-mode session per owner.
CREATE UNIQUE INDEX "ModeSession_one_open_per_owner" ON "ModeSession"("ownerId") WHERE "endedAt" IS NULL;

-- Money and hours can never be negative; events cannot end before they start.
ALTER TABLE "IncomeDeposit" ADD CONSTRAINT "IncomeDeposit_net_nonneg" CHECK ("netCents" >= 0);
ALTER TABLE "PayRate" ADD CONSTRAINT "PayRate_positive" CHECK ("regularHourlyCents" > 0 AND "overtimeMultiplierBp" >= 10000);
ALTER TABLE "OvertimeShift" ADD CONSTRAINT "OvertimeShift_nonneg"
  CHECK ("regularHoursX100" >= 0 AND "overtimeHoursX100" >= 0 AND "breakMinutes" >= 0 AND "estimatedGrossCents" >= 0 AND "endAt" > "startAt");
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_end_after_start" CHECK ("endAt" >= "startAt");
ALTER TABLE "ChallengeTile" ADD CONSTRAINT "ChallengeTile_amount_pos" CHECK ("amountCents" > 0);
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_target_nonneg" CHECK ("targetCents" IS NULL OR "targetCents" >= 0);

-- A payday may only be RECEIVED when a deposit exists is enforced in the service layer
-- inside a transaction; deposit uniqueness per payday is the paydayId UNIQUE index above.
