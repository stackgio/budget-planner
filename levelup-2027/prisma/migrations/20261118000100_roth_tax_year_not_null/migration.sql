-- Fix: the previous CHECK let NULL through (NULL BETWEEN … is NULL, and CHECK only rejects FALSE).
-- Every Roth line must carry an explicit tax year. Existing rows were backfilled by the prior migration.
SET CONSTRAINTS ALL IMMEDIATE;
UPDATE "AllocationLine" SET "taxYear" = EXTRACT(YEAR FROM "createdAt")::int WHERE target = 'ROTH' AND "taxYear" IS NULL;
ALTER TABLE "AllocationLine" DROP CONSTRAINT "AllocationLine_roth_tax_year";
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_roth_tax_year"
  CHECK (target <> 'ROTH' OR ("taxYear" IS NOT NULL AND "taxYear" BETWEEN 2000 AND 2100));
