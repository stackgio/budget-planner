-- Phase 2: financial ledger. Reviewed: additive only. The single destructive-looking step
-- (dropping IncomeDeposit_paydayId_key) is immediately replaced by a partial unique index
-- that still allows only ONE active deposit per payday, while letting voided corrections stay in history.

-- CreateEnum
CREATE TYPE "PlanKind" AS ENUM ('OVERTIME_ROULETTE', 'EXTRA_PAYCHECK');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LineTarget" AS ENUM ('ROTH', 'FUN', 'EMERGENCY', 'GOAL', 'MOVING_TILE', 'SCHD_DAY', 'DEBT_TILE');

-- CreateEnum
CREATE TYPE "LineStatus" AS ENUM ('PLANNED', 'RESERVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('ROTH_CONTRIBUTION', 'SAVINGS_TRANSFER', 'INVESTMENT_CONTRIBUTION', 'DEBT_PAYMENT', 'FUN_MONEY', 'EMERGENCY_SAVINGS', 'GOAL_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('ROULETTE', 'EXTRA_PAYCHECK', 'MANUAL', 'HISTORICAL_IMPORT');

-- DropIndex
DROP INDEX "IncomeDeposit_paydayId_key";

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "configuredAt" TIMESTAMPTZ,
ADD COLUMN     "priorPaidCents" INTEGER,
ADD COLUMN     "setupNote" TEXT;

-- AlterTable
ALTER TABLE "IncomeDeposit" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "requestHash" TEXT,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "DebtBalance" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "asOf" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationPlan" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "PlanKind" NOT NULL,
    "depositId" TEXT,
    "forecastMonth" TEXT,
    "forecastCents" INTEGER,
    "budgetCents" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "seed" TEXT,
    "leftoverToFun" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "approvedAt" TIMESTAMPTZ,
    "closedAt" TIMESTAMPTZ,

    CONSTRAINT "AllocationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationLine" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "target" "LineTarget" NOT NULL,
    "label" TEXT,
    "tileId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "paidCents" INTEGER,
    "status" "LineStatus" NOT NULL DEFAULT 'PLANNED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMPTZ,

    CONSTRAINT "AllocationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "source" "PaymentSource" NOT NULL,
    "lineId" TEXT,
    "tileId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "paidOn" DATE NOT NULL,
    "taxYear" INTEGER,
    "label" TEXT,
    "note" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "reversedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RothYear" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "limitCents" INTEGER,
    "note" TEXT,

    CONSTRAINT "RothYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouletteSettings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "PlanKind" NOT NULL,
    "rothCents" INTEGER NOT NULL,
    "funCents" INTEGER NOT NULL,
    "leftoverToFun" BOOLEAN NOT NULL,
    "topN" INTEGER NOT NULL DEFAULT 10,
    "rotationPointer" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RouletteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AllocationPlan_ownerId_status_idx" ON "AllocationPlan"("ownerId", "status");

-- CreateIndex
CREATE INDEX "AllocationLine_planId_idx" ON "AllocationLine"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reversalOfId_key" ON "Payment"("reversalOfId");

-- CreateIndex
CREATE INDEX "Payment_ownerId_kind_idx" ON "Payment"("ownerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "RothYear_ownerId_taxYear_key" ON "RothYear"("ownerId", "taxYear");

-- CreateIndex
CREATE UNIQUE INDEX "RouletteSettings_ownerId_kind_key" ON "RouletteSettings"("ownerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeDeposit_idempotencyKey_key" ON "IncomeDeposit"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IncomeDeposit_ownerId_kind_idx" ON "IncomeDeposit"("ownerId", "kind");

-- AddForeignKey
ALTER TABLE "DebtBalance" ADD CONSTRAINT "DebtBalance_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationPlan" ADD CONSTRAINT "AllocationPlan_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "IncomeDeposit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AllocationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "ChallengeTile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "AllocationLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "ChallengeTile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- ───────────── Hand-written ledger invariants ─────────────

-- One ACTIVE deposit per payday (voided corrections are kept as history).
CREATE UNIQUE INDEX "IncomeDeposit_one_active_per_payday" ON "IncomeDeposit"("paydayId") WHERE "voidedAt" IS NULL AND "paydayId" IS NOT NULL;

-- A tile can be reserved/completed by only one allocation line at a time.
CREATE UNIQUE INDEX "AllocationLine_one_live_per_tile" ON "AllocationLine"("tileId") WHERE "tileId" IS NOT NULL AND status IN ('RESERVED', 'COMPLETED');

-- A tile can have only one active (non-reversed) payment.
CREATE UNIQUE INDEX "Payment_one_active_per_tile" ON "Payment"("tileId") WHERE "tileId" IS NOT NULL AND "reversedAt" IS NULL AND "reversalOfId" IS NULL;

-- One open draft per funding deposit and kind (drafts survive refresh and are reused).
CREATE UNIQUE INDEX "AllocationPlan_one_draft_per_deposit" ON "AllocationPlan"("ownerId", "kind", "depositId") WHERE status = 'DRAFT' AND "depositId" IS NOT NULL;
CREATE UNIQUE INDEX "AllocationPlan_one_forecast_draft_per_month" ON "AllocationPlan"("ownerId", "forecastMonth") WHERE status = 'DRAFT' AND "depositId" IS NULL;

ALTER TABLE "AllocationPlan" ADD CONSTRAINT "AllocationPlan_amounts_nonneg" CHECK ("budgetCents" >= 0 AND ("forecastCents" IS NULL OR "forecastCents" >= 0));
ALTER TABLE "AllocationPlan" ADD CONSTRAINT "AllocationPlan_binding_needs_deposit" CHECK (status = 'DRAFT' OR "depositId" IS NOT NULL);
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_amounts" CHECK ("amountCents" > 0 AND ("paidCents" IS NULL OR ("paidCents" > 0 AND "paidCents" <= "amountCents")));
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_tile_targets" CHECK (("tileId" IS NOT NULL) = (target IN ('MOVING_TILE', 'SCHD_DAY', 'DEBT_TILE')));
ALTER TABLE "AllocationLine" ADD CONSTRAINT "AllocationLine_completed_paid" CHECK (status <> 'COMPLETED' OR "paidCents" IS NOT NULL);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sign" CHECK (("reversalOfId" IS NULL AND "amountCents" > 0) OR ("reversalOfId" IS NOT NULL AND "amountCents" < 0));
ALTER TABLE "RothYear" ADD CONSTRAINT "RothYear_limit_nonneg" CHECK ("limitCents" IS NULL OR "limitCents" >= 0);
ALTER TABLE "RouletteSettings" ADD CONSTRAINT "RouletteSettings_nonneg" CHECK ("rothCents" >= 0 AND "funCents" >= 0 AND "topN" BETWEEN 1 AND 50);
ALTER TABLE "DebtBalance" ADD CONSTRAINT "DebtBalance_nonneg" CHECK ("balanceCents" >= 0);

-- Database-level guard: committed (reserved + completed) allocations can never exceed a deposit's net amount.
-- Deferred so a multi-line approval is checked once, at commit. The service layer also locks the deposit row.
CREATE FUNCTION levelup_check_deposit_commitment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE dep TEXT; net INTEGER; voided TIMESTAMPTZ; total BIGINT;
BEGIN
  SELECT "depositId" INTO dep FROM "AllocationPlan" WHERE id = NEW."planId";
  IF dep IS NULL THEN RETURN NULL; END IF;
  SELECT "netCents", "voidedAt" INTO net, voided FROM "IncomeDeposit" WHERE id = dep;
  SELECT COALESCE(SUM(CASE WHEN l.status = 'COMPLETED' THEN l."paidCents" ELSE l."amountCents" END), 0) INTO total
    FROM "AllocationLine" l JOIN "AllocationPlan" p ON p.id = l."planId"
   WHERE p."depositId" = dep AND l.status IN ('RESERVED', 'COMPLETED');
  IF total > 0 AND voided IS NOT NULL THEN
    RAISE EXCEPTION 'LEVELUP_LEDGER: deposit % is voided but has committed allocations', dep;
  END IF;
  IF total > net THEN
    RAISE EXCEPTION 'LEVELUP_LEDGER: deposit % over-committed (% > %)', dep, total, net;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "AllocationLine_deposit_commitment" AFTER INSERT OR UPDATE ON "AllocationLine"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION levelup_check_deposit_commitment();

-- A deposit cannot be voided or reduced below what is committed against it.
CREATE FUNCTION levelup_check_deposit_update() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE total BIGINT;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN l.status = 'COMPLETED' THEN l."paidCents" ELSE l."amountCents" END), 0) INTO total
    FROM "AllocationLine" l JOIN "AllocationPlan" p ON p.id = l."planId"
   WHERE p."depositId" = NEW.id AND l.status IN ('RESERVED', 'COMPLETED');
  IF total > 0 AND (NEW."voidedAt" IS NOT NULL OR NEW."netCents" < total) THEN
    RAISE EXCEPTION 'LEVELUP_LEDGER: deposit % has % committed; cancel or reverse allocations first', NEW.id, total;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "IncomeDeposit_commitment" AFTER UPDATE ON "IncomeDeposit"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION levelup_check_deposit_update();

-- Financial history is append-only: committed lines and payments cannot be deleted.
CREATE FUNCTION levelup_block_history_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'AllocationLine' AND OLD.status = 'PLANNED' THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'LEVELUP_LEDGER: % rows are permanent history and cannot be deleted', TG_TABLE_NAME;
END $$;
CREATE TRIGGER "AllocationLine_no_delete" BEFORE DELETE ON "AllocationLine" FOR EACH ROW EXECUTE FUNCTION levelup_block_history_delete();
CREATE TRIGGER "Payment_no_delete" BEFORE DELETE ON "Payment" FOR EACH ROW EXECUTE FUNCTION levelup_block_history_delete();
CREATE TRIGGER "IncomeDeposit_no_delete" BEFORE DELETE ON "IncomeDeposit" FOR EACH ROW EXECUTE FUNCTION levelup_block_history_delete();
