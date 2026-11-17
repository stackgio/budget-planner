-- Phase 4 prep: editable workout templates and education records. Additive, nullable/defaulted columns only.
-- AlterTable
ALTER TABLE "EduCourse" ADD COLUMN     "archivedAt" TIMESTAMPTZ,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "GoalMilestone" ADD COLUMN     "archivedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "TuitionItem" ADD COLUMN     "archivedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'HOME',
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WorkoutTemplateItem" ADD COLUMN     "weightNote" TEXT;

ALTER TABLE "WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_kind" CHECK (kind IN ('HOME', 'GYM', 'RECOVERY'));
