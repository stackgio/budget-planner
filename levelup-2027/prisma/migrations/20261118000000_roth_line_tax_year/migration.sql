-- Run the deferred ledger trigger checks immediately during this migration, so the backfill UPDATE
-- leaves no pending trigger events (Postgres refuses ALTER TABLE while events are pending).
-- The ledger checks still run; they just run per statement instead of at commit.
SET CONSTRAINTS ALL IMMEDIATE;

-- AlterTable
ALTER TABLE "AllocationLine" ADD COLUMN     "taxYear" INTEGER;


-- Backfill: existing Roth lines get the tax year of the deposit that funds them (or the plan's creation year).
UPDATE "AllocationLine" l
   SET "taxYear" = COALESCE(EXTRACT(YEAR FROM d."actualDepositDate")::int, EXTRACT(YEAR FROM (p."createdAt" AT TIME ZONE 'America/New_York'))::int)
  FROM "AllocationPlan" p LEFT JOIN "IncomeDeposit" d ON d.id = p."depositId"
 WHERE l."planId" = p.id AND l.target = 'ROTH' AND l."taxYear" IS NULL;

-- Completed Roth lines: align with the tax year actually recorded on their payment.
UPDATE "AllocationLine" l SET "taxYear" = pay."taxYear"
  FROM "Payment" pay
 WHERE pay."lineId" = l.id AND pay."reversalOfId" IS NULL AND l.target = 'ROTH' AND pay."taxYear" IS NOT NULL;

ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_roth_tax_year" CHECK (target <> 'ROTH' OR ("taxYear" BETWEEN 2000 AND 2100));
