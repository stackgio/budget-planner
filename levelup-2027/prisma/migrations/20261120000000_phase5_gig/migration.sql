-- CreateEnum
CREATE TYPE "GigPayStatus" AS ENUM ('PENDING', 'PAID', 'DISPUTED');

-- CreateTable
CREATE TABLE "GigPlatform" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigSettings" (
    "ownerId" TEXT NOT NULL,
    "monthlyTargetCents" INTEGER NOT NULL DEFAULT 50000,
    "taxReserveBps" INTEGER,
    "costPerMileMills" INTEGER,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigSettings_pkey" PRIMARY KEY ("ownerId")
);

-- CreateTable
CREATE TABLE "GigSession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "startAt" TIMESTAMPTZ,
    "endAt" TIMESTAMPTZ,
    "minutes" INTEGER NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "tipsCents" INTEGER NOT NULL DEFAULT 0,
    "tipsInGross" BOOLEAN NOT NULL DEFAULT true,
    "bonusCents" INTEGER NOT NULL DEFAULT 0,
    "bonusInGross" BOOLEAN NOT NULL DEFAULT true,
    "parkingTollsCents" INTEGER NOT NULL DEFAULT 0,
    "otherExpenseCents" INTEGER NOT NULL DEFAULT 0,
    "notesCipher" TEXT,
    "status" "GigPayStatus" NOT NULL DEFAULT 'PENDING',
    "payoutId" TEXT,
    "plannedEventId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigMileage" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "platformId" TEXT,
    "tripDate" DATE NOT NULL,
    "milesHundredths" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "odometerStartTenths" INTEGER,
    "odometerEndTenths" INTEGER,
    "sessionId" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigMileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigPayout" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "externalRef" TEXT,
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "voidedAt" TIMESTAMPTZ,
    "voidReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GigPlatform_ownerId_name_key" ON "GigPlatform"("ownerId", "name");

-- CreateIndex
CREATE INDEX "GigSession_ownerId_workDate_idx" ON "GigSession"("ownerId", "workDate");

-- CreateIndex
CREATE INDEX "GigSession_payoutId_idx" ON "GigSession"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "GigMileage_sessionId_key" ON "GigMileage"("sessionId");

-- CreateIndex
CREATE INDEX "GigMileage_ownerId_tripDate_idx" ON "GigMileage"("ownerId", "tripDate");

-- CreateIndex
CREATE UNIQUE INDEX "GigPayout_depositId_key" ON "GigPayout"("depositId");

-- CreateIndex
CREATE UNIQUE INDEX "GigPayout_idempotencyKey_key" ON "GigPayout"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GigPayout_ownerId_createdAt_idx" ON "GigPayout"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "GigSession" ADD CONSTRAINT "GigSession_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "GigPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigSession" ADD CONSTRAINT "GigSession_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "GigPayout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigMileage" ADD CONSTRAINT "GigMileage_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "GigPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigMileage" ADD CONSTRAINT "GigMileage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GigSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigPayout" ADD CONSTRAINT "GigPayout_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "GigPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigPayout" ADD CONSTRAINT "GigPayout_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "IncomeDeposit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ───── Hand-written guards (reviewed). Additive only: no existing table or row is changed. ─────

ALTER TABLE "GigSettings" ADD CONSTRAINT "GigSettings_ranges" CHECK (
  "monthlyTargetCents" >= 0
  AND ("taxReserveBps" IS NULL OR "taxReserveBps" BETWEEN 0 AND 10000)
  AND ("costPerMileMills" IS NULL OR "costPerMileMills" BETWEEN 0 AND 100000));

ALTER TABLE "GigSession" ADD CONSTRAINT "GigSession_amounts_nonneg" CHECK (
  "grossCents" >= 0 AND "tipsCents" >= 0 AND "bonusCents" >= 0 AND "parkingTollsCents" >= 0 AND "otherExpenseCents" >= 0);
ALTER TABLE "GigSession" ADD CONSTRAINT "GigSession_minutes" CHECK ("minutes" BETWEEN 0 AND 1440);
ALTER TABLE "GigSession" ADD CONSTRAINT "GigSession_times" CHECK ("startAt" IS NULL OR "endAt" IS NULL OR "endAt" > "startAt");
-- PAID means "part of a confirmed payout", and only that.
ALTER TABLE "GigSession" ADD CONSTRAINT "GigSession_paid_has_payout" CHECK (("status" = 'PAID') = ("payoutId" IS NOT NULL));

ALTER TABLE "GigMileage" ADD CONSTRAINT "GigMileage_miles" CHECK ("milesHundredths" BETWEEN 0 AND 200000);
ALTER TABLE "GigMileage" ADD CONSTRAINT "GigMileage_odometer" CHECK (
  ("odometerStartTenths" IS NULL OR "odometerStartTenths" >= 0)
  AND ("odometerStartTenths" IS NULL OR "odometerEndTenths" IS NULL OR "odometerEndTenths" >= "odometerStartTenths"));

-- A platform payout ID can be confirmed only once (while active).
CREATE UNIQUE INDEX "GigPayout_one_active_externalRef" ON "GigPayout"("ownerId", "platformId", "externalRef")
  WHERE "externalRef" IS NOT NULL AND "voidedAt" IS NULL;

-- A payout must point at a GIG deposit of the same owner, and both are active or both are voided.
-- A GIG deposit cannot exist without its payout. Deferred: both rows are written in one transaction.
CREATE FUNCTION levelup_check_gig_payout() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p RECORD; d RECORD;
BEGIN
  IF TG_TABLE_NAME = 'GigPayout' THEN
    SELECT * INTO p FROM "GigPayout" WHERE id = NEW.id;
    SELECT * INTO d FROM "IncomeDeposit" WHERE id = p."depositId";
  ELSE
    IF NEW.kind <> 'GIG' THEN RETURN NULL; END IF;
    SELECT * INTO d FROM "IncomeDeposit" WHERE id = NEW.id;
    SELECT * INTO p FROM "GigPayout" WHERE "depositId" = NEW.id;
    IF p.id IS NULL THEN RAISE EXCEPTION 'LEVELUP_LEDGER: gig deposit % has no confirmed payout', NEW.id; END IF;
  END IF;
  IF d.kind <> 'GIG' OR d."ownerId" <> p."ownerId" OR d."paydayId" IS NOT NULL THEN
    RAISE EXCEPTION 'LEVELUP_LEDGER: payout % must link a GIG deposit of the same owner', p.id;
  END IF;
  IF (p."voidedAt" IS NULL) <> (d."voidedAt" IS NULL) THEN
    RAISE EXCEPTION 'LEVELUP_LEDGER: payout % and its deposit must be voided together', p.id;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "GigPayout_consistency" AFTER INSERT OR UPDATE ON "GigPayout"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION levelup_check_gig_payout();
CREATE CONSTRAINT TRIGGER "IncomeDeposit_gig_consistency" AFTER INSERT OR UPDATE ON "IncomeDeposit"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION levelup_check_gig_payout();

-- Payouts are financial history.
CREATE TRIGGER "GigPayout_no_delete" BEFORE DELETE ON "GigPayout" FOR EACH ROW EXECUTE FUNCTION levelup_block_history_delete();

-- Analytics: deposits by owner and date.
CREATE INDEX "IncomeDeposit_ownerId_actualDepositDate_idx" ON "IncomeDeposit"("ownerId", "actualDepositDate");
