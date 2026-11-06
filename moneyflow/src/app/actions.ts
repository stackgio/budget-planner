"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId, loadWorkspace } from "@/lib/workspace";
import { isISODate, isYearMonth, todayISO } from "@/lib/dates";
import { parseDollars, formatCents, centsToDecimalString } from "@/lib/money";
import { allocate, BUCKETS, validateRules } from "@/lib/paycheck";
import { perCheckReserve, type ReserveMode } from "@/lib/bills";
import { LIABILITY_TYPES, transferLegs, validateSplits } from "@/lib/ledger";
import { dedupe, guessMapping, mapRows, parseCsv, type CsvMapping } from "@/lib/csv";
import { resetWorkspace } from "@/lib/seed";
import { authEnabled, checkPasscode, makeSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, sign, WORKSPACE_COOKIE } from "@/lib/session";
import { parseShares } from "@/lib/money";
import { cleanEmoji } from "@/lib/emoji";

export type Result = { ok: boolean; error?: string; message?: string };

class UserError extends Error {}
const fail = (msg: string): never => {
  throw new UserError(msg);
};

async function run(fn: () => Promise<string | void>): Promise<Result> {
  try {
    const message = await fn();
    revalidatePath("/", "layout");
    return { ok: true, message: message ?? "Saved" };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
      revalidatePath("/", "layout");
      throw e;
    }
    console.error(e);
    return { ok: false, error: "Something went wrong saving that. Nothing was changed." };
  }
}

// ---------- form helpers (server-side validation) ----------
const str = (fd: FormData, k: string, max = 200): string => String(fd.get(k) ?? "").trim().slice(0, max);
const optStr = (fd: FormData, k: string, max = 500): string | null => str(fd, k, max) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true" || fd.get(k) === "1";
function money(fd: FormData, k: string, label: string, opts: { required?: boolean; allowNegative?: boolean } = {}): number | null {
  const raw = str(fd, k);
  if (!raw) return opts.required ? fail(`${label} is required`) : null;
  const c = parseDollars(raw);
  if (c === null) return fail(`${label}: "${raw}" is not a valid amount`);
  if (!opts.allowNegative && c < 0) return fail(`${label} can't be negative`);
  if (Math.abs(c) > 100_000_000_00) return fail(`${label} is unrealistically large`);
  return c;
}
function date(fd: FormData, k: string, label: string, required = true): string | null {
  const v = str(fd, k, 10);
  if (!v) return required ? fail(`${label} is required`) : null;
  if (!isISODate(v)) return fail(`${label} must be a valid date`);
  return v;
}
function int(fd: FormData, k: string, label: string, min: number, max: number): number | null {
  const v = str(fd, k, 10);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return fail(`${label} must be a whole number from ${min} to ${max}`);
  return n;
}
function pct(fd: FormData, k: string, label: string): number | null {
  const v = str(fd, k, 12).replace("%", "");
  if (!v) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return fail(`${label} must be a percentage like 24.99`);
  const [w, f = ""] = v.split(".");
  const bps = Number(w) * 100 + Number((f + "00").slice(0, 2));
  if (bps > 10_000) return fail(`${label} can't exceed 100%`);
  return bps;
}
function oneOf<T extends string>(v: string, allowed: readonly T[], label: string): T {
  return (allowed as readonly string[]).includes(v) ? (v as T) : fail(`Invalid ${label}`);
}
async function audit(userId: string, kind: string, message: string) {
  await prisma.auditEvent.create({ data: { userId, kind, message } });
}
async function ownAccount(userId: string, id: string | null | undefined, label = "Account") {
  if (!id) return fail(`${label} is required`);
  const a = await prisma.account.findFirst({ where: { id, userId } });
  return a ?? fail(`${label} not found`);
}
async function ownCategory(userId: string, id: string | null) {
  if (!id) return null;
  const c = await prisma.category.findFirst({ where: { id, userId } });
  return c ? c.id : fail("Category not found");
}

// ---------- auth & workspaces ----------
/** Mark cookies Secure whenever the request really arrived over HTTPS (e.g. behind Railway's proxy). */
async function cookieSecure(): Promise<boolean> {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  return proto === "https" || process.env.MONEYFLOW_FORCE_SECURE_COOKIES === "1";
}

export async function login(_: unknown, fd: FormData): Promise<Result> {
  if (!authEnabled()) redirect("/");
  if (!(await checkPasscode(String(fd.get("passcode") ?? "")))) {
    await new Promise((r) => setTimeout(r, 800)); // slow brute force
    return { ok: false, error: "Incorrect passcode" };
  }
  (await cookies()).set(SESSION_COOKIE, await makeSessionToken(), { httpOnly: true, sameSite: "lax", secure: await cookieSecure(), maxAge: SESSION_TTL_SECONDS, path: "/" });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(authEnabled() ? "/login" : "/");
}

export async function switchWorkspace(fd: FormData) {
  const mode = oneOf(str(fd, "mode"), ["demo", "personal"] as const, "mode");
  await getUserId(); // ensures workspaces exist
  const u = await prisma.user.findFirst({ where: { mode } });
  if (!u) return;
  (await cookies()).set(WORKSPACE_COOKIE, await sign(u.id), { httpOnly: true, sameSite: "lax", secure: await cookieSecure(), maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetWorkspaceAction(_: unknown, fd: FormData): Promise<Result> {
  const mode = str(fd, "mode") === "personal" ? "personal" : "demo";
  if (mode === "personal" && str(fd, "confirm") !== "RESET") return { ok: false, error: 'Type RESET to confirm erasing your personal data.' };
  const id = await resetWorkspace(prisma, mode);
  (await cookies()).set(WORKSPACE_COOKIE, await sign(id), { httpOnly: true, sameSite: "lax", secure: await cookieSecure(), maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
  redirect(mode === "personal" ? "/welcome" : "/");
}

// ---------- paycheck & settings ----------
export async function savePaySettings(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const anchor = date(fd, "anchorPayday", "Known payday", false);
    const net = money(fd, "netPay", "Net pay per paycheck", { required: true })!;
    if (net === 0) fail("Net pay must be greater than zero");
    const interval = int(fd, "payIntervalDays", "Pay interval", 7, 31) ?? 14;
    const before = await prisma.settings.findUniqueOrThrow({ where: { userId } });
    await prisma.settings.update({ where: { userId }, data: { anchorPayday: anchor, netPayCents: net, payIntervalDays: interval } });
    const changes: string[] = [];
    if (before.anchorPayday !== anchor) changes.push(`known payday ${before.anchorPayday ?? "unset"} → ${anchor ?? "unset"}`);
    if (before.netPayCents !== net) changes.push(`net pay ${formatCents(before.netPayCents)} → ${formatCents(net)}`);
    if (before.payIntervalDays !== interval) changes.push(`interval ${before.payIntervalDays} → ${interval} days`);
    if (changes.length) await audit(userId, "pay-settings", `Pay settings changed: ${changes.join("; ")}`);
    return "Pay schedule saved";
  });
}

export async function saveSettings(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const primaryAccountId = optStr(fd, "primaryAccountId");
    if (primaryAccountId) await ownAccount(userId, primaryAccountId);
    await prisma.settings.update({
      where: { userId },
      data: { emergencyTargetCents: money(fd, "emergencyTarget", "Emergency fund target"), investingGoalMonthly: money(fd, "investingGoal", "Monthly investing goal"), primaryAccountId },
    });
  });
}

export async function setReserveMode(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const mode = oneOf(str(fd, "mode"), ["half_month", "annualized"] as const, "reserve mode");
    await prisma.settings.update({ where: { userId }, data: { reserveMode: mode } });
    await audit(userId, "reserve-mode", `Bill reserve mode set to ${mode}`);
    return `Reserve mode: ${mode === "half_month" ? "half-month" : "annualized (26 checks)"}`;
  });
}

export async function saveAllocationRules(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const rules = await prisma.allocationRule.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } });
    const next = rules.map((r) => ({ ...r, percentBps: pct(fd, `pct_${r.key}`, r.label) ?? fail(`${r.label} percentage is required`) }));
    const err = validateRules(next);
    if (err) fail(err);
    const paused = bool(fd, "investingPaused");
    const settings = await prisma.settings.findUniqueOrThrow({ where: { userId } });
    const changed = next.filter((n) => rules.find((r) => r.id === n.id)!.percentBps !== n.percentBps);
    if (!changed.length && paused === settings.investingPaused) return "No changes";
    if (str(fd, "confirm") !== "yes") fail("Please tick the confirmation box — allocation rules only change when you confirm.");
    await prisma.$transaction([
      ...next.map((n) => prisma.allocationRule.update({ where: { id: n.id }, data: { percentBps: n.percentBps } })),
      prisma.settings.update({ where: { userId }, data: { investingPaused: paused } }),
    ]);
    const msg = [
      ...changed.map((n) => `${n.label} ${(rules.find((r) => r.id === n.id)!.percentBps / 100).toFixed(2)}% → ${(n.percentBps / 100).toFixed(2)}%`),
      paused !== settings.investingPaused ? (paused ? "Investing paused" : "Investing resumed") : "",
    ].filter(Boolean).join("; ");
    await audit(userId, "allocation", `Allocation rules changed by you: ${msg}`);
    return "Allocation rules updated";
  });
}

export async function recordPaycheck(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const payDate = date(fd, "payDate", "Pay date")!;
    const kind = oneOf(str(fd, "kind") || "regular", ["regular", "overtime", "bonus", "irregular"] as const, "income type");
    const settings = await prisma.settings.findUniqueOrThrow({ where: { userId } });
    const expected = money(fd, "expected", "Expected amount") ?? (kind === "regular" ? settings.netPayCents : null) ?? fail("Expected amount is required");
    const actual = money(fd, "actual", "Actual amount");
    const notes = optStr(fd, "notes");
    const existing = await prisma.paycheckEvent.findUnique({ where: { userId_payDate_kind: { userId, payDate, kind } } });
    let transactionId = existing?.transactionId ?? null;
    const depositTo = optStr(fd, "accountId");
    if (actual !== null && depositTo && !transactionId) {
      const acct = await ownAccount(userId, depositTo);
      const cat = await prisma.category.findFirst({ where: { userId, name: kind === "regular" ? "Paycheck" : "Other Income" } });
      const tx = await prisma.transaction.create({ data: { userId, accountId: acct.id, date: payDate, merchant: kind === "regular" ? "Paycheck" : `${kind[0].toUpperCase()}${kind.slice(1)} income`, amountCents: actual, type: "income", categoryId: cat?.id ?? null, notes: "Recorded from My Paycheck" } });
      transactionId = tx.id;
    } else if (transactionId && actual !== null) {
      await prisma.transaction.updateMany({ where: { id: transactionId, userId }, data: { amountCents: actual } });
    }
    await prisma.paycheckEvent.upsert({
      where: { userId_payDate_kind: { userId, payDate, kind } },
      create: { userId, payDate, kind, expectedCents: expected, actualCents: actual, notes, transactionId },
      update: { expectedCents: expected, actualCents: actual, notes, transactionId },
    });
    return actual !== null ? `Recorded ${formatCents(actual)} received` : "Expected amount saved";
  });
}

export async function deletePaycheckRecord(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const rec = await prisma.paycheckEvent.findFirst({ where: { id: str(fd, "id"), userId } });
    if (!rec) fail("Record not found");
    if (rec!.transactionId && bool(fd, "deleteTx")) await prisma.transaction.deleteMany({ where: { id: rec!.transactionId, userId } });
    await prisma.paycheckEvent.delete({ where: { id: rec!.id } });
    return "Removed";
  });
}

export async function addAssignment(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const payDate = date(fd, "payDate", "Pay date")!;
    const target = str(fd, "target"); // e.g. "bucket:needs", "goal:<id>", "debt:<id>", "category:<id>", "other:"
    const [targetType, targetIdRaw] = target.split(":");
    oneOf(targetType, ["bucket", "category", "goal", "debt", "bill", "other"] as const, "envelope");
    const targetId = targetIdRaw || null;
    let label = optStr(fd, "label");
    if (targetType === "bucket") label = label ?? oneOf(targetId ?? "", BUCKETS, "bucket");
    if (targetType === "goal") label = label ?? ((await prisma.savingsGoal.findFirst({ where: { id: targetId!, userId } })) ?? fail("Goal not found")).name;
    if (targetType === "debt") label = label ?? (await ownAccount(userId, targetId, "Debt account")).name;
    if (targetType === "category") label = label ?? ((await prisma.category.findFirst({ where: { id: targetId!, userId } })) ?? fail("Category not found")).name;
    if (targetType === "bill") label = label ?? ((await prisma.bill.findFirst({ where: { id: targetId!, userId } })) ?? fail("Bill not found")).name;
    const amount = money(fd, "amount", "Amount", { required: true })!;
    if (amount === 0) fail("Amount must be more than zero");
    await prisma.paycheckAssignment.create({ data: { userId, payDate, targetType, targetId, label: label ?? "Other", amountCents: amount } });
    return `Assigned ${formatCents(amount)} to ${label ?? "Other"}`;
  });
}

export async function deleteAssignment(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.paycheckAssignment.deleteMany({ where: { id: str(fd, "id"), userId } });
    return "Removed";
  });
}

/** Creates assignments from the standard plan — only when the user clicks it. */
export async function applyStandardPlan(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const payDate = date(fd, "payDate", "Pay date")!;
    const income = money(fd, "income", "Income", { required: true })!;
    const ws = await loadWorkspace();
    const mode = ws.settings.reserveMode as ReserveMode;
    const already = ws.assignments.filter((a) => a.payDate === payDate).reduce((a, x) => a + x.amountCents, 0);
    if (already > 0) fail("This paycheck already has assignments. Clear them first to apply the standard plan.");
    const alloc = allocate(income, ws.rules, { investingPaused: ws.settings.investingPaused });
    const reserves = ws.bills.filter((b) => b.active).map((b) => ({ b, cents: perCheckReserve(b, mode) }));
    const reserveTotal = reserves.reduce((a, r) => a + r.cents, 0);
    const rows: Array<{ targetType: string; targetId: string | null; label: string; amountCents: number }> = [];
    for (const r of reserves) rows.push({ targetType: "bill", targetId: r.b.id, label: `${r.b.name} reserve`, amountCents: r.cents });
    for (const p of alloc.parts) {
      let amt = p.amountCents;
      if (p.key === "needs") amt -= reserveTotal; // bill reserves come out of Needs
      if (amt > 0) rows.push({ targetType: "bucket", targetId: p.key, label: p.key === "needs" ? "Needs (after bill reserves)" : p.label, amountCents: amt });
    }
    const total = rows.reduce((a, r) => a + r.amountCents, 0);
    if (total > income) {
      // Needs reserve exceeds the Needs share — keep it honest: only assign what exists.
      fail(`Bill reserves (${formatCents(reserveTotal)}) are larger than the Needs share — the standard plan would assign ${formatCents(total)} of ${formatCents(income)}. Adjust bills or allocations, or assign manually.`);
    }
    await prisma.paycheckAssignment.createMany({ data: rows.map((r) => ({ userId, payDate, ...r })) });
    return `Applied standard plan (${formatCents(total)} assigned)`;
  });
}

export async function clearAssignments(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const payDate = date(fd, "payDate", "Pay date")!;
    await prisma.paycheckAssignment.deleteMany({ where: { userId, payDate } });
    return "Assignments cleared";
  });
}

/** Mark bill reserves from a paycheck as actually set aside (user-confirmed). */
export async function fundReserves(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const payDate = date(fd, "payDate", "Pay date")!;
    const settings = await prisma.settings.findUniqueOrThrow({ where: { userId } });
    const ids = fd.getAll("billId").map(String);
    if (!ids.length) fail("Tick at least one bill reserve to confirm.");
    const bills = await prisma.bill.findMany({ where: { userId, active: true, id: { in: ids } } });
    const unfund = bool(fd, "unfund");
    for (const b of bills) {
      const planned = perCheckReserve(b, settings.reserveMode as ReserveMode);
      const custom = fd.get(`amount_${b.id}`) ? money(fd, `amount_${b.id}`, `${b.name} amount`) : null;
      const funded = unfund ? 0 : (custom ?? planned);
      await prisma.billReserve.upsert({
        where: { billId_payDate: { billId: b.id, payDate } },
        create: { userId, billId: b.id, payDate, plannedCents: planned, fundedCents: funded, fundedAt: unfund ? null : new Date() },
        update: { plannedCents: planned, fundedCents: funded, fundedAt: unfund ? null : new Date() },
      });
    }
    return unfund ? "Reserve marked unfunded" : `Confirmed ${bills.length} reserve${bills.length === 1 ? "" : "s"} as set aside`;
  });
}

// ---------- categories & budgets ----------
export async function saveCategory(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const id = optStr(fd, "id");
    const name = str(fd, "name", 60) || fail("Name is required");
    const bucket = oneOf(str(fd, "bucket"), ["needs", "investing", "goals", "guiltfree", "income", "transfer"] as const, "bucket");
    const color = /^#[0-9a-f]{6}$/i.test(str(fd, "color")) ? str(fd, "color") : "#10b981";
    const monthlyBudgetCents = money(fd, "monthlyBudget", "Monthly budget");
    const emojiRaw = cleanEmoji(str(fd, "emoji", 16));
    if (emojiRaw === false) fail("Emoji should be one emoji (like 🍔), not text");
    const emoji = emojiRaw === false ? null : emojiRaw;
    const dup = await prisma.category.findFirst({ where: { userId, name, NOT: id ? { id } : undefined } });
    if (dup) fail(`A category named "${name}" already exists`);
    if (id) {
      const before = await prisma.category.findFirst({ where: { id, userId } });
      if (!before) fail("Category not found");
      await prisma.category.update({ where: { id }, data: { name, bucket, color, monthlyBudgetCents, ...(fd.has("emoji") ? { emoji } : {}) } });
      if (before!.bucket !== bucket) await audit(userId, "category", `Category "${name}" moved from ${before!.bucket} to ${bucket}`);
    } else {
      await prisma.category.create({ data: { userId, name, bucket, color, monthlyBudgetCents, emoji } });
    }
    return "Category saved";
  });
}

export async function archiveCategory(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.category.updateMany({ where: { id: str(fd, "id"), userId }, data: { archived: !bool(fd, "restore") } });
  });
}

export async function setMonthBudget(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const month = str(fd, "month");
    if (!isYearMonth(month)) fail("Invalid month");
    const categoryId = (await ownCategory(userId, str(fd, "categoryId")))!;
    const amount = money(fd, "amount", "Budget");
    if (bool(fd, "asDefault")) {
      await prisma.category.update({ where: { id: categoryId }, data: { monthlyBudgetCents: amount } });
      await prisma.budget.deleteMany({ where: { userId, month, categoryId } });
      return "Default monthly budget saved";
    }
    if (amount === null) await prisma.budget.deleteMany({ where: { userId, month, categoryId } });
    else await prisma.budget.upsert({ where: { userId_month_categoryId: { userId, month, categoryId } }, create: { userId, month, categoryId, amountCents: amount }, update: { amountCents: amount } });
    return "Budget saved for this month";
  });
}

export async function decidePlanLine(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const status = oneOf(str(fd, "status"), ["accepted", "dismissed", "draft"] as const, "status");
    const line = await prisma.planLine.findFirst({ where: { id: str(fd, "id"), userId } });
    if (!line) fail("Plan line not found");
    const amount = money(fd, "amount", "Monthly amount");
    await prisma.planLine.update({ where: { id: line!.id }, data: { status, monthlyCents: amount ?? line!.monthlyCents } });
    await audit(userId, "plan-line", `${line!.name} marked ${status}`);
    return `${line!.name}: ${status}`;
  });
}

// ---------- transactions ----------
export async function saveTransaction(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const id = optStr(fd, "id");
    const type = oneOf(str(fd, "type"), ["expense", "income", "refund", "transfer"] as const, "type");
    const dateV = date(fd, "date", "Date")!;
    const merchant = str(fd, "merchant", 120) || fail("Merchant / description is required");
    const amountAbs = money(fd, "amount", "Amount", { required: true })!;
    if (amountAbs === 0) fail("Amount can't be zero");
    const acct = await ownAccount(userId, str(fd, "accountId"));
    const notes = optStr(fd, "notes", 1000);
    const tags = str(fd, "tags", 200).split(",").map((t) => t.trim()).filter(Boolean).join(",") || null;

    if (type === "transfer") {
      if (id) fail("Edit a transfer by deleting and re-creating it so both sides stay in sync.");
      const to = await ownAccount(userId, str(fd, "toAccountId"), "Destination account");
      const kind = LIABILITY_TYPES.has(to.type) ? "debt_payment" : to.type === "investment" ? "investment" : to.type === "savings" ? "savings" : "internal";
      const legs = transferLegs({ fromAccountId: acct.id, toAccountId: to.id, amountCents: amountAbs, date: dateV, kind, group: randomUUID(), memo: merchant });
      await prisma.transaction.createMany({ data: legs.map((l) => ({ userId, accountId: l.accountId, date: l.date, merchant: l.merchant, amountCents: l.amountCents, type: "transfer", transferKind: l.transferKind, transferGroup: l.transferGroup, notes, tags })) });
      if (kind === "investment") {
        const leg = await prisma.transaction.findFirst({ where: { userId, transferGroup: legs[1].transferGroup, accountId: to.id } });
        await prisma.investmentContribution.create({ data: { userId, accountId: to.id, date: dateV, amountCents: amountAbs, taxYear: Number(dateV.slice(0, 4)), transactionId: leg!.id } });
      }
      return `Transfer of ${formatCents(amountAbs)} recorded (not counted as spending)`;
    }
    // Sign from the account's perspective: expenses reduce the account (or increase card debt).
    const amountCents = type === "expense" ? -amountAbs : amountAbs;
    const categoryId = await ownCategory(userId, optStr(fd, "categoryId"));
    const billId = optStr(fd, "billId");
    if (billId && !(await prisma.bill.findFirst({ where: { id: billId, userId } }))) fail("Bill not found");

    let splits: Array<{ categoryId: string | null; amountCents: number; note: string | null }> = [];
    const splitJson = str(fd, "splits", 20_000);
    if (splitJson) {
      const parsed = JSON.parse(splitJson) as Array<{ categoryId: string; amount: string; note?: string }>;
      for (const s of parsed.filter((s) => s.amount)) {
        const c = parseDollars(s.amount);
        if (c === null || c <= 0) fail(`Split amount "${s.amount}" is invalid`);
        splits.push({ categoryId: await ownCategory(userId, s.categoryId || null), amountCents: type === "expense" ? -c! : c!, note: s.note?.slice(0, 200) || null });
      }
      if (splits.length === 1) splits = [];
      const err = validateSplits({ date: dateV, amountCents, type, accountId: acct.id, categoryId, splits });
      if (err) fail(`Splits must add up to the transaction amount (${formatCents(amountAbs)}).`);
    }
    const necessityRaw = str(fd, "necessity", 10);
    const necessity = type === "expense" && (necessityRaw === "need" || necessityRaw === "want") ? necessityRaw : null;
    const data = { accountId: acct.id, date: dateV, merchant, amountCents, type, categoryId: splits.length ? null : categoryId, notes, tags, billId, necessity };
    if (id) {
      const existing = await prisma.transaction.findFirst({ where: { id, userId } });
      if (!existing) fail("Transaction not found");
      if (existing!.type === "transfer") fail("Transfers can't be converted here — delete and re-create.");
      await prisma.$transaction([
        prisma.transactionSplit.deleteMany({ where: { transactionId: id } }),
        prisma.transaction.update({ where: { id }, data: { ...data, splits: { create: splits } } }),
      ]);
      return "Transaction updated";
    }
    await prisma.transaction.create({ data: { userId, ...data, splits: { create: splits } } });
    return `${type === "expense" ? "Expense" : type === "income" ? "Income" : "Refund"} of ${formatCents(amountAbs)} saved`;
  });
}

export async function deleteTransaction(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const tx = await prisma.transaction.findFirst({ where: { id: str(fd, "id"), userId } });
    if (!tx) fail("Transaction not found");
    if (tx!.transferGroup) {
      const legs = await prisma.transaction.findMany({ where: { userId, transferGroup: tx!.transferGroup } });
      await prisma.investmentContribution.deleteMany({ where: { userId, transactionId: { in: legs.map((l) => l.id) } } });
      await prisma.transaction.deleteMany({ where: { userId, transferGroup: tx!.transferGroup } });
      return "Both sides of the transfer deleted";
    }
    await prisma.paycheckEvent.updateMany({ where: { userId, transactionId: tx!.id }, data: { transactionId: null } });
    await prisma.transaction.delete({ where: { id: tx!.id } });
    return "Transaction deleted";
  });
}

export type ImportPreview = {
  ok: boolean;
  error?: string;
  headers?: string[];
  sample?: string[][];
  mapping?: CsvMapping;
  rows?: Array<{ rowIndex: number; date: string; merchant: string; amount: string; amountCents: number; category: string | null; duplicate: boolean }>;
  errors?: Array<{ rowIndex: number; error: string }>;
};

export async function previewImport(csvText: string, accountId: string, mapping: CsvMapping | null): Promise<ImportPreview> {
  try {
    const userId = await getUserId();
    await ownAccount(userId, accountId);
    if (csvText.length > 4_000_000) return { ok: false, error: "File too large (4 MB max)" };
    const table = parseCsv(csvText);
    if (!table.headers.length) return { ok: false, error: "The file looks empty." };
    const m = mapping ?? guessMapping(table.headers);
    const { rows, errors } = mapRows(table, m, accountId);
    const existing = await prisma.transaction.findMany({ where: { userId, accountId, importHash: { in: rows.map((r) => r.hash) } }, select: { importHash: true } });
    const { duplicates } = dedupe(rows, new Set(existing.map((e) => e.importHash!)));
    const dupSet = new Set(duplicates.map((d) => d.rowIndex));
    return {
      ok: true,
      headers: table.headers,
      sample: table.rows.slice(0, 3),
      mapping: m,
      rows: rows.map((r) => ({ rowIndex: r.rowIndex, date: r.date, merchant: r.merchant, amount: centsToDecimalString(r.amountCents), amountCents: r.amountCents, category: r.category, duplicate: dupSet.has(r.rowIndex) })),
      errors,
    };
  } catch (e) {
    return { ok: false, error: e instanceof UserError ? e.message : "Could not read that CSV file." };
  }
}

export async function commitImport(csvText: string, accountId: string, mapping: CsvMapping, fileName: string, skipRows: number[]): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const acct = await ownAccount(userId, accountId);
    const table = parseCsv(csvText);
    const { rows } = mapRows(table, mapping, accountId);
    const existing = await prisma.transaction.findMany({ where: { userId, accountId, importHash: { in: rows.map((r) => r.hash) } }, select: { importHash: true } });
    const { fresh, duplicates } = dedupe(rows, new Set(existing.map((e) => e.importHash!)));
    const skip = new Set(skipRows);
    const toImport = fresh.filter((r) => !skip.has(r.rowIndex));
    const cats = await prisma.category.findMany({ where: { userId } });
    const isLiability = LIABILITY_TYPES.has(acct.type);
    const batch = await prisma.importBatch.create({ data: { userId, fileName: fileName.slice(0, 200), accountId, rowCount: rows.length, importedCount: toImport.length, duplicateCount: duplicates.length } });
    await prisma.transaction.createMany({
      data: toImport.map((r) => {
        const cat = r.category ? cats.find((c) => c.name.toLowerCase() === r.category!.toLowerCase()) : undefined;
        // Positive inflows on a card are payments/credits → treat as transfer-like refunds only if user recategorizes;
        // default: outflow = expense, inflow = income (checking) or refund (card).
        const type = r.amountCents < 0 ? "expense" : isLiability ? "refund" : "income";
        return { userId, accountId, date: r.date, merchant: r.merchant.slice(0, 120), amountCents: r.amountCents, type, categoryId: cat?.id ?? null, importHash: r.hash, importBatchId: batch.id, notes: r.category && !cat ? `Bank category: ${r.category}` : null };
      }),
    });
    return `Imported ${toImport.length} transaction${toImport.length === 1 ? "" : "s"}; skipped ${duplicates.length} duplicate${duplicates.length === 1 ? "" : "s"}${skip.size ? ` and ${skip.size} you excluded` : ""}. Review new rows: card payments and transfers should be re-labeled as transfers.`;
  });
}

// ---------- accounts ----------
const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit_card", "loan", "personal_debt", "investment"] as const;

export async function saveAccount(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const id = optStr(fd, "id");
    const data = {
      name: str(fd, "name", 80) || fail("Name is required"),
      type: oneOf(str(fd, "type"), ACCOUNT_TYPES, "account type"),
      subtype: optStr(fd, "subtype", 40),
      institution: optStr(fd, "institution", 80),
      creditLimitCents: money(fd, "creditLimit", "Credit limit"),
      aprBps: pct(fd, "apr", "APR"),
      minPaymentCents: money(fd, "minPayment", "Minimum payment"),
      dueDay: int(fd, "dueDay", "Due day", 1, 31),
      notes: optStr(fd, "notes", 1000),
      verified: bool(fd, "verified"),
    };
    if (id) {
      if (!(await prisma.account.findFirst({ where: { id, userId } }))) fail("Account not found");
      await prisma.account.update({ where: { id }, data });
    } else {
      const a = await prisma.account.create({ data: { userId, ...data } });
      const bal = money(fd, "balance", "Current balance", { allowNegative: true });
      if (bal !== null) await prisma.accountSnapshot.create({ data: { userId, accountId: a.id, date: todayISO(), balanceCents: LIABILITY_TYPES.has(a.type) ? -Math.abs(bal) : bal, note: "Opening balance" } });
    }
    return "Account saved";
  });
}

export async function addSnapshot(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const acct = await ownAccount(userId, str(fd, "accountId"));
    const d = date(fd, "date", "Date")!;
    const bal = money(fd, "balance", LIABILITY_TYPES.has(acct.type) ? "Amount owed" : "Balance", { required: true, allowNegative: !LIABILITY_TYPES.has(acct.type) })!;
    // Liabilities are entered as a positive amount owed and stored as negative net value.
    const balanceCents = LIABILITY_TYPES.has(acct.type) ? -Math.abs(bal) : bal;
    await prisma.accountSnapshot.create({ data: { userId, accountId: acct.id, date: d, balanceCents, note: optStr(fd, "note") } });
    return `${acct.name}: ${LIABILITY_TYPES.has(acct.type) ? "owed" : "balance"} ${formatCents(Math.abs(bal))} as of ${d}`;
  });
}

export async function deleteSnapshot(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.accountSnapshot.deleteMany({ where: { id: str(fd, "id"), userId } });
    return "Balance entry removed";
  });
}

export async function updateDebtTerms(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const acct = await ownAccount(userId, str(fd, "accountId"));
    if (!LIABILITY_TYPES.has(acct.type)) fail("Not a debt account");
    await prisma.account.update({
      where: { id: acct.id },
      data: { aprBps: pct(fd, "apr", "APR"), minPaymentCents: money(fd, "minPayment", "Minimum payment"), dueDay: int(fd, "dueDay", "Due day", 1, 31), creditLimitCents: money(fd, "creditLimit", "Credit limit"), verified: bool(fd, "verified") },
    });
    const bal = money(fd, "owed", "Amount owed");
    if (bal !== null) await prisma.accountSnapshot.create({ data: { userId, accountId: acct.id, date: date(fd, "asOf", "As-of date", false) ?? todayISO(), balanceCents: -Math.abs(bal), note: "Entered on Debt page" } });
    return `${acct.name} updated`;
  });
}

export async function archiveAccount(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.account.updateMany({ where: { id: str(fd, "id"), userId }, data: { archived: !bool(fd, "restore") } });
  });
}

// ---------- bills ----------
export async function saveBill(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const id = optStr(fd, "id");
    const frequency = oneOf(str(fd, "frequency") || "monthly", ["monthly", "biweekly", "weekly", "annual"] as const, "frequency");
    const accountId = optStr(fd, "accountId");
    if (accountId) await ownAccount(userId, accountId);
    const debtAccountId = optStr(fd, "debtAccountId");
    if (debtAccountId) await ownAccount(userId, debtAccountId);
    const data = {
      name: str(fd, "name", 80) || fail("Name is required"),
      amountCents: money(fd, "amount", "Amount", { required: true })!,
      frequency,
      dueDay: int(fd, "dueDay", "Due day", 1, 31),
      dueMonth: int(fd, "dueMonth", "Due month", 1, 12),
      anchorDate: date(fd, "anchorDate", "First due date", false),
      categoryId: await ownCategory(userId, optStr(fd, "categoryId")),
      accountId,
      debtAccountId,
      autopay: bool(fd, "autopay"),
      verified: bool(fd, "verified"),
      notes: optStr(fd, "notes", 1000),
    };
    if (id) {
      const before = await prisma.bill.findFirst({ where: { id, userId } });
      if (!before) fail("Bill not found");
      await prisma.bill.update({ where: { id }, data });
      if (before!.amountCents !== data.amountCents) await audit(userId, "bill", `${data.name} amount ${formatCents(before!.amountCents)} → ${formatCents(data.amountCents)}`);
    } else await prisma.bill.create({ data: { userId, ...data } });
    return `${data.name} saved`;
  });
}

export async function deleteBill(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.bill.deleteMany({ where: { id: str(fd, "id"), userId } });
    return "Bill removed";
  });
}

/** Record a bill payment as a real transaction (expense, or transfer for debt bills). */
export async function payBill(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const bill = await prisma.bill.findFirst({ where: { id: str(fd, "billId"), userId } });
    if (!bill) fail("Bill not found");
    const d = date(fd, "date", "Paid date")!;
    const amount = money(fd, "amount", "Amount") ?? bill!.amountCents;
    const from = await ownAccount(userId, optStr(fd, "accountId") ?? bill!.accountId, "Paid-from account");
    if (bill!.debtAccountId) {
      const legs = transferLegs({ fromAccountId: from.id, toAccountId: bill!.debtAccountId, amountCents: amount, date: d, kind: "debt_payment", group: randomUUID(), memo: bill!.name });
      await prisma.transaction.createMany({ data: legs.map((l) => ({ userId, accountId: l.accountId, date: l.date, merchant: l.merchant, amountCents: l.amountCents, type: "transfer", transferKind: l.transferKind, transferGroup: l.transferGroup, billId: bill!.id })) });
    } else {
      await prisma.transaction.create({ data: { userId, accountId: from.id, date: d, merchant: bill!.name, amountCents: -amount, type: "expense", categoryId: bill!.categoryId, billId: bill!.id } });
    }
    return `${bill!.name} payment of ${formatCents(amount)} recorded`;
  });
}

// ---------- goals ----------
export async function saveGoal(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const id = optStr(fd, "id");
    const accountId = optStr(fd, "accountId");
    if (accountId) await ownAccount(userId, accountId);
    const data = {
      name: str(fd, "name", 80) || fail("Name is required"),
      kind: oneOf(str(fd, "kind") || "custom", ["emergency", "moving", "travel", "birthday", "general", "custom"] as const, "goal type"),
      targetCents: money(fd, "target", "Target"),
      targetDate: date(fd, "targetDate", "Target date", false),
      monthlyContributionCents: money(fd, "monthly", "Monthly contribution"),
      priority: int(fd, "priority", "Priority", 1, 99) ?? 5,
      accountId,
      verified: bool(fd, "verified"),
      notes: optStr(fd, "notes", 1000),
    };
    if (id) {
      if (!(await prisma.savingsGoal.findFirst({ where: { id, userId } }))) fail("Goal not found");
      await prisma.savingsGoal.update({ where: { id }, data });
    } else await prisma.savingsGoal.create({ data: { userId, ...data } });
    if (data.kind === "emergency" && data.targetCents !== null) await prisma.settings.update({ where: { userId }, data: { emergencyTargetCents: data.targetCents } });
    return `${data.name} saved`;
  });
}

export async function archiveGoal(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.savingsGoal.updateMany({ where: { id: str(fd, "id"), userId }, data: { archived: !bool(fd, "restore") } });
  });
}

export async function addGoalContribution(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const goal = await prisma.savingsGoal.findFirst({ where: { id: str(fd, "goalId"), userId } });
    if (!goal) fail("Goal not found");
    const d = date(fd, "date", "Date")!;
    const amt = money(fd, "amount", "Amount", { required: true })!;
    const withdraw = bool(fd, "withdraw");
    let transactionId: string | null = null;
    const from = optStr(fd, "fromAccountId");
    if (from && goal!.accountId && from !== goal!.accountId && !withdraw) {
      // Moving money into the goal's account is a transfer — never spending.
      await ownAccount(userId, from);
      const legs = transferLegs({ fromAccountId: from, toAccountId: goal!.accountId, amountCents: amt, date: d, kind: "savings", group: randomUUID(), memo: `To ${goal!.name}` });
      await prisma.transaction.createMany({ data: legs.map((l) => ({ userId, accountId: l.accountId, date: l.date, merchant: l.merchant, amountCents: l.amountCents, type: "transfer", transferKind: l.transferKind, transferGroup: l.transferGroup })) });
      transactionId = (await prisma.transaction.findFirst({ where: { userId, transferGroup: legs[1].transferGroup, accountId: goal!.accountId } }))?.id ?? null;
    }
    await prisma.goalContribution.create({ data: { userId, goalId: goal!.id, date: d, amountCents: withdraw ? -amt : amt, transactionId, note: optStr(fd, "note") } });
    return `${withdraw ? "Withdrew" : "Added"} ${formatCents(amt)} ${withdraw ? "from" : "to"} ${goal!.name}`;
  });
}

export async function deleteGoalContribution(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.goalContribution.deleteMany({ where: { id: str(fd, "id"), userId } });
    return "Contribution removed (any linked transfer stays in Transactions)";
  });
}

// ---------- investments ----------
export async function saveHolding(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const id = optStr(fd, "id");
    const acct = await ownAccount(userId, str(fd, "accountId"));
    if (acct.type !== "investment") fail("Holdings belong to investment accounts");
    const shares = str(fd, "shares", 20) || "0";
    try { parseShares(shares); } catch { fail("Shares must be a number like 12.5"); }
    const price = money(fd, "price", "Price");
    const data = {
      accountId: acct.id,
      symbol: (str(fd, "symbol", 12).toUpperCase() || fail("Symbol is required")) as string,
      name: optStr(fd, "name", 80),
      shares,
      costBasisCents: money(fd, "costBasis", "Cost basis"),
      manualPriceCents: price,
      priceAsOf: price !== null ? (date(fd, "priceAsOf", "Price date", false) ?? todayISO()) : null,
      verified: bool(fd, "verified"),
    };
    if (id) {
      if (!(await prisma.holding.findFirst({ where: { id, userId } }))) fail("Holding not found");
      await prisma.holding.update({ where: { id }, data });
    } else await prisma.holding.create({ data: { userId, ...data } });
    return `${data.symbol} saved`;
  });
}

export async function deleteHolding(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.holding.deleteMany({ where: { id: str(fd, "id"), userId } });
    return "Holding removed";
  });
}

export async function addInvestmentContribution(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const acct = await ownAccount(userId, str(fd, "accountId"));
    if (acct.type !== "investment") fail("Choose an investment account");
    const d = date(fd, "date", "Date")!;
    const amt = money(fd, "amount", "Amount", { required: true })!;
    const from = optStr(fd, "fromAccountId");
    let transactionId: string | null = null;
    if (from) {
      await ownAccount(userId, from);
      const legs = transferLegs({ fromAccountId: from, toAccountId: acct.id, amountCents: amt, date: d, kind: "investment", group: randomUUID(), memo: `${acct.name} contribution` });
      await prisma.transaction.createMany({ data: legs.map((l) => ({ userId, accountId: l.accountId, date: l.date, merchant: l.merchant, amountCents: l.amountCents, type: "transfer", transferKind: l.transferKind, transferGroup: l.transferGroup })) });
      transactionId = (await prisma.transaction.findFirst({ where: { userId, transferGroup: legs[1].transferGroup, accountId: acct.id } }))?.id ?? null;
    }
    await prisma.investmentContribution.create({ data: { userId, accountId: acct.id, date: d, amountCents: amt, taxYear: int(fd, "taxYear", "Tax year", 2000, 2100) ?? Number(d.slice(0, 4)), transactionId, note: optStr(fd, "note") } });
    return `Contribution of ${formatCents(amt)} recorded`;
  });
}

export async function deleteInvestmentContribution(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    await prisma.investmentContribution.deleteMany({ where: { id: str(fd, "id"), userId } });
    return "Contribution removed (any linked transfer stays in Transactions)";
  });
}

// ---------- verification & onboarding ----------
export async function verifyItem(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    const kind = oneOf(str(fd, "kind"), ["bill", "account", "goal"] as const, "item");
    const id = str(fd, "id");
    const verified = !bool(fd, "unverify");
    if (kind === "bill") await prisma.bill.updateMany({ where: { id, userId }, data: { verified } });
    if (kind === "account") await prisma.account.updateMany({ where: { id, userId }, data: { verified } });
    if (kind === "goal") await prisma.savingsGoal.updateMany({ where: { id, userId }, data: { verified } });
    return verified ? "Marked as confirmed" : "Marked as unconfirmed";
  });
}

export async function completeOnboarding(_: unknown, fd: FormData): Promise<Result> {
  return run(async () => {
    const userId = await getUserId();
    if (!bool(fd, "ack")) fail("Please confirm you've reviewed the amounts.");
    const bills = await prisma.bill.findMany({ where: { userId } });
    for (const b of bills) {
      const amt = money(fd, `bill_${b.id}`, b.name, { required: true })!;
      const dueDay = int(fd, `due_${b.id}`, `${b.name} due day`, 1, 31);
      const confirm = bool(fd, `confirm_${b.id}`);
      await prisma.bill.update({ where: { id: b.id }, data: { amountCents: amt, dueDay, verified: confirm } });
    }
    const net = money(fd, "netPay", "Net pay", { required: true })!;
    const anchor = date(fd, "anchorPayday", "Known payday", false);
    await prisma.settings.update({ where: { userId }, data: { netPayCents: net, anchorPayday: anchor, profileConfirmedAt: new Date() } });
    const lines = await prisma.planLine.findMany({ where: { userId } });
    for (const l of lines) {
      const decision = str(fd, `plan_${l.id}`);
      if (["accepted", "dismissed", "draft"].includes(decision)) await prisma.planLine.update({ where: { id: l.id }, data: { status: decision } });
    }
    await prisma.user.update({ where: { id: userId }, data: { onboardedAt: new Date() } });
    await audit(userId, "onboarding", `Profile reviewed: net pay ${formatCents(net)}, payday ${anchor ?? "not set"}, ${bills.filter((b) => bool(fd, `confirm_${b.id}`)).length}/${bills.length} bills confirmed.`);
    redirect("/");
  });
}
