-- Phase 3: Goals & Personal Growth. Additive only: new tables + two nullable link columns (Task.goalId, CalendarEvent.goalId/workoutTemplateId).
-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('FINANCE', 'FITNESS', 'FAITH', 'RELATIONSHIP', 'EDUCATION', 'CAREER', 'COMMUNICATION', 'READING', 'LEARNING', 'DISCIPLINE', 'TIME_MANAGEMENT', 'PROJECT', 'PERSONAL');

-- CreateEnum
CREATE TYPE "GoalHorizon" AS ENUM ('YEAR', 'QUARTER', 'MONTH', 'WEEK');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgressSource" AS ENUM ('MANUAL', 'MILESTONES', 'TASKS', 'HABIT', 'CHALLENGE', 'WORKOUTS', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('COMPLETED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DateStatus" AS ENUM ('PLANNED', 'COMPLETED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlphabetStatus" AS ENUM ('OPEN', 'PLANNED', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "goalId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "goalId" TEXT;

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL,
    "horizon" "GoalHorizon" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" DATE NOT NULL,
    "targetDate" DATE,
    "unit" TEXT,
    "targetX100" INTEGER,
    "source" "ProgressSource" NOT NULL DEFAULT 'MANUAL',
    "challengeId" TEXT,
    "habitId" TEXT,
    "activityKind" TEXT,
    "notesCipher" TEXT,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalMilestone" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATE,
    "completedAt" TIMESTAMPTZ,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgress" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "valueX100" INTEGER NOT NULL,
    "recordedOn" DATE NOT NULL,
    "note" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthSettings" (
    "ownerId" TEXT NOT NULL,
    "workoutsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "weightUnit" TEXT NOT NULL DEFAULT 'lb',
    "dateNightWeekday" INTEGER NOT NULL DEFAULT 5,
    "dateNightTime" TEXT NOT NULL DEFAULT '18:30',
    "faithDaysPerWeek" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "GrowthSettings_pkey" PRIMARY KEY ("ownerId")
);

-- CreateTable
CREATE TABLE "ReminderPreference" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "days" INTEGER[],
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "cues" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "restSec" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkoutTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "eventId" TEXT,
    "originalStart" TIMESTAMPTZ,
    "durationMin" INTEGER,
    "effort" INTEGER,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER,
    "weightX100" INTEGER,
    "durationSec" INTEGER,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMetric" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "valueX100" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "measuredOn" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaithEntry" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutes" INTEGER,
    "passage" TEXT,
    "bodyCipher" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaithEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlan" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "eventId" TEXT,
    "status" "DateStatus" NOT NULL DEFAULT 'PLANNED',
    "budgetCents" INTEGER,
    "actualCostCents" INTEGER,
    "paymentId" TEXT,
    "letter" TEXT,
    "notesCipher" TEXT,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateIdea" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "estCostCents" INTEGER,
    "letter" TEXT,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DateIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportantDate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "year" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ImportantDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipNote" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "bodyCipher" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlphabetEntry" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "activity" TEXT,
    "estBudgetCents" INTEGER,
    "status" "AlphabetStatus" NOT NULL DEFAULT 'OPEN',
    "datePlanId" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AlphabetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EduProgram" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "credential" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESEARCHING',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EduProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EduCourse" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "programId" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "credits" INTEGER,
    "term" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "grade" TEXT,

    CONSTRAINT "EduCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionItem" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "term" TEXT,
    "label" TEXT NOT NULL,
    "estCents" INTEGER NOT NULL,
    "actualCents" INTEGER,
    "notes" TEXT,

    CONSTRAINT "TuitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerProfile" (
    "ownerId" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hireDate" DATE,
    "notes" TEXT,

    CONSTRAINT "CareerProfile_pkey" PRIMARY KEY ("ownerId")
);

-- CreateTable
CREATE TABLE "CareerCredential" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "completedOn" DATE,
    "expiresOn" DATE,
    "notes" TEXT,

    CONSTRAINT "CareerCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpportunity" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "location" TEXT,
    "payMinCents" INTEGER,
    "payMaxCents" INTEGER,
    "payPeriod" TEXT NOT NULL DEFAULT 'HOURLY',
    "deadline" DATE,
    "status" TEXT NOT NULL DEFAULT 'RESEARCHING',
    "appliedOn" DATE,
    "interviewOn" DATE,
    "notesCipher" TEXT,
    "prepNotesCipher" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "JobOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,
    "title" TEXT,
    "note" TEXT,
    "goalId" TEXT,
    "courseId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "reflectionCipher" TEXT,
    "priorities" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_ownerId_status_idx" ON "Goal"("ownerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoalProgress_idempotencyKey_key" ON "GoalProgress"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderPreference_ownerId_key_key" ON "ReminderPreference"("ownerId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_ownerId_name_key" ON "Exercise"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutTemplate_ownerId_name_key" ON "WorkoutTemplate"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_idempotencyKey_key" ON "WorkoutLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WorkoutLog_ownerId_date_idx" ON "WorkoutLog"("ownerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_ownerId_eventId_originalStart_key" ON "WorkoutLog"("ownerId", "eventId", "originalStart");

-- CreateIndex
CREATE INDEX "BodyMetric_ownerId_kind_measuredOn_idx" ON "BodyMetric"("ownerId", "kind", "measuredOn");

-- CreateIndex
CREATE UNIQUE INDEX "FaithEntry_idempotencyKey_key" ON "FaithEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FaithEntry_ownerId_date_idx" ON "FaithEntry"("ownerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlan_paymentId_key" ON "DatePlan"("paymentId");

-- CreateIndex
CREATE INDEX "DatePlan_ownerId_date_idx" ON "DatePlan"("ownerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AlphabetEntry_datePlanId_key" ON "AlphabetEntry"("datePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "AlphabetEntry_ownerId_letter_key" ON "AlphabetEntry"("ownerId", "letter");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLog_idempotencyKey_key" ON "ActivityLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ActivityLog_ownerId_date_idx" ON "ActivityLog"("ownerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Review_ownerId_kind_periodStart_key" ON "Review"("ownerId", "kind", "periodStart");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalMilestone" ADD CONSTRAINT "GoalMilestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplateItem" ADD CONSTRAINT "WorkoutTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_logId_fkey" FOREIGN KEY ("logId") REFERENCES "WorkoutLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────────── Hand-written integrity rules ─────────────
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_cost_single_source" CHECK ("actualCostCents" IS NULL OR "paymentId" IS NULL);
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_amounts_nonneg" CHECK (("budgetCents" IS NULL OR "budgetCents" >= 0) AND ("actualCostCents" IS NULL OR "actualCostCents" >= 0));
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_completed_has_time" CHECK (status <> 'COMPLETED' OR "completedAt" IS NOT NULL);
ALTER TABLE "AlphabetEntry" ADD CONSTRAINT "AlphabetEntry_letter" CHECK (letter ~ '^[A-Z]$');
ALTER TABLE "AlphabetEntry" ADD CONSTRAINT "AlphabetEntry_completed_needs_date" CHECK (status <> 'COMPLETED' OR ("completedAt" IS NOT NULL AND "datePlanId" IS NOT NULL));
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_ranges" CHECK (("effort" IS NULL OR "effort" BETWEEN 1 AND 10) AND ("durationMin" IS NULL OR "durationMin" BETWEEN 1 AND 600));
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_nonneg" CHECK (("reps" IS NULL OR "reps" >= 0) AND ("weightX100" IS NULL OR "weightX100" >= 0) AND ("durationSec" IS NULL OR "durationSec" >= 0));
ALTER TABLE "BodyMetric" ADD CONSTRAINT "BodyMetric_positive" CHECK ("valueX100" > 0);
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_minutes" CHECK ("minutes" BETWEEN 1 AND 1440);
ALTER TABLE "FaithEntry" ADD CONSTRAINT "FaithEntry_minutes" CHECK ("minutes" IS NULL OR "minutes" BETWEEN 1 AND 1440);
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_target_pos" CHECK ("targetX100" IS NULL OR "targetX100" > 0);
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_dates" CHECK ("targetDate" IS NULL OR "targetDate" >= "startDate");
ALTER TABLE "ImportantDate" ADD CONSTRAINT "ImportantDate_valid" CHECK ("month" BETWEEN 1 AND 12 AND "day" BETWEEN 1 AND 31);
ALTER TABLE "TuitionItem" ADD CONSTRAINT "TuitionItem_nonneg" CHECK ("estCents" >= 0 AND ("actualCents" IS NULL OR "actualCents" >= 0));
ALTER TABLE "JobOpportunity" ADD CONSTRAINT "JobOpportunity_pay" CHECK (("payMinCents" IS NULL OR "payMinCents" > 0) AND ("payMaxCents" IS NULL OR "payMaxCents" >= COALESCE("payMinCents", 0)));
-- A date linked to a confirmed Phase 2 payment must reference a real payment (no double-counting: cost lives in one place).
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
