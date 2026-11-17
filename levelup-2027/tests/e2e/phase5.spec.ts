import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Runs after phase4 on the shared test database. Local only; nothing external is contacted.
const EMAIL = "owner@example.test";
const PASSWORD = "correct horse battery staple";
const SHOTS = process.env.SCREENSHOT_DIR;
const db = new PrismaClient();
test.afterAll(async () => { await db.$disconnect(); });

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hey Gio/ })).toBeVisible();
}
async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true, animations: "disabled" });
}
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}
const dialog = (page: Page) => page.locator("dialog[open]").last();
const status = (page: Page) => page.locator("p[role=status]");
const alert = (page: Page) => page.locator("p[role=alert]");
const todayNY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

test.describe.serial("Phase 5 — Gig income, analytics, notifications", () => {
  test("gig: log a session — earnings show, no money is created", async ({ page }) => {
    const depositsBefore = await db.incomeDeposit.count();
    await login(page);
    await page.goto("/money/gig");
    await expect(page.getByRole("heading", { name: "🚗 Gig Income" })).toBeVisible();
    await expect(page.getByText("Monthly target $500.00")).toBeVisible();
    await page.getByRole("button", { name: "Log session" }).click();
    const d = dialog(page);
    await d.getByLabel("Platform").selectOption({ label: "DoorDash" });
    await d.getByLabel("Start").fill("17:00");
    await d.getByLabel("End").fill("20:00");
    await d.getByLabel("Gross earnings").fill("72.50");
    await d.getByLabel("Tips", { exact: true }).fill("20");
    await d.getByLabel("Miles").fill("31.5");
    await d.getByLabel("Parking/tolls").fill("2.50");
    await d.getByRole("button", { name: "Log session" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByText("$72.50").first()).toBeVisible();
    await expect(page.getByText("awaiting payout").first()).toBeVisible();
    expect(await db.incomeDeposit.count()).toBe(depositsBefore);
    await noHorizontalScroll(page);
  });

  test("gig: confirm a payout once; a duplicate is caught; ledger shows it as gig income", async ({ page }) => {
    await login(page);
    await page.goto("/money/gig");
    const confirm = async () => {
      await page.getByRole("button", { name: "Confirm payout" }).click();
      const d = dialog(page);
      await d.getByLabel("Amount deposited").fill("70.00");
      await d.getByLabel("Date it arrived").fill(todayNY());
      return d;
    };
    let d = await confirm();
    await d.getByRole("checkbox").first().check();
    await expect(d.getByText(/Sessions total \$72\.50; deposit is \$70\.00/)).toBeVisible();
    await d.getByRole("button", { name: "Confirm payout received" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("region").or(page.locator("section")).filter({ hasText: "Payouts received" }).getByText("$70.00")).toBeVisible();
    await shot(page, "50-gig-income");
    await noHorizontalScroll(page);

    d = await confirm();
    await d.getByRole("button", { name: "Confirm payout received" }).click();
    await expect(alert(page).filter({ hasText: /already confirmed/ })).toBeVisible();
    await page.keyboard.press("Escape");
    const gig = await db.incomeDeposit.findMany({ where: { kind: "GIG", voidedAt: null } });
    expect(gig).toHaveLength(1);
    expect(gig[0]!.netCents).toBe(7_000);

    await page.goto("/money");
    await expect(page.getByText(/Gig \d{4}/)).toBeVisible();
    await page.goto("/money/roulette");
    await expect(page.getByRole("heading", { name: "Gig payouts (only if you choose)" })).toBeVisible();
    expect(await db.allocationPlan.count({ where: { deposit: { kind: "GIG" } } })).toBe(0);
  });

  test("gig: correcting a payout voids it and keeps history", async ({ page }) => {
    await login(page);
    await page.goto("/money/gig");
    await page.getByRole("button", { name: "Correct" }).first().click();
    await dialog(page).getByLabel("Reason").fill("Typed the wrong amount");
    await dialog(page).getByRole("button", { name: "Void payout" }).click();
    await expect(page.getByText("Voided: Typed the wrong amount")).toBeVisible();
    expect(await db.incomeDeposit.count({ where: { kind: "GIG", voidedAt: null } })).toBe(0);
    expect(await db.incomeDeposit.count({ where: { kind: "GIG" } })).toBe(1);
    await expect(page.getByText("awaiting payout").first()).toBeVisible();
  });

  test("gig: mileage log, settings and CSV export", async ({ page }) => {
    await login(page);
    await page.goto("/money/gig/mileage");
    await page.getByRole("button", { name: "Add trip" }).click();
    const d = dialog(page);
    await d.getByLabel("Business purpose").fill("Drive to Veho hub");
    await d.getByLabel("Odometer start (optional)").fill("45210.4");
    await d.getByLabel("Odometer end (optional)").fill("45222.5");
    await d.getByRole("button", { name: "Add trip" }).click();
    await expect(page.getByText("Drive to Veho hub")).toBeVisible();
    await expect(page.getByText("12.1 mi").first()).toBeVisible();
    await shot(page, "51-gig-mileage");
    await noHorizontalScroll(page);

    await page.goto("/money/gig");
    await page.getByRole("button", { name: "Gig settings" }).click();
    await dialog(page).getByLabel("Monthly gross-income target").fill("600");
    await dialog(page).getByLabel(/Tax reserve/).fill("25");
    await dialog(page).getByRole("button", { name: "Save settings" }).click();
    await expect(status(page).filter({ hasText: "Saved." })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByText("Monthly target $600.00")).toBeVisible();
    await expect(page.getByText(/your 25% planning estimate/)).toBeVisible();

    const y = todayNY().slice(0, 4);
    const csv = await page.request.get(`/api/export/gig?kind=mileage&from=${y}-01-01&to=${y}-12-31`);
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body).toContain("Drive to Veho hub");
    expect(body).toContain("not tax advice");
  });

  test("analytics: confirmed income, filters, custom range and empty periods", async ({ page }) => {
    await login(page);
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Confirmed income" })).toBeVisible();
    await expect(page.getByLabel("Legend")).toContainText("Gig payouts");
    await shot(page, "52-analytics-month");
    await noHorizontalScroll(page);
    for (const k of ["week", "quarter", "year"]) {
      await page.getByRole("link", { name: k, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`period=${k}`));
      await noHorizontalScroll(page);
    }
    await page.getByRole("link", { name: "custom", exact: true }).click();
    await page.getByLabel("From").fill("2020-01-01");
    await page.getByLabel("To").fill("2020-01-31");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("No gig work logged in this period.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Habits" }).locator("..").locator("..")).toContainText("No days of this period have passed since you started");
    await page.goto("/analytics?period=year");
    await shot(page, "53-analytics-year");
  });

  test("notifications: simulated test notification and diagnostics (no real push)", async ({ page }) => {
    await login(page);
    await page.goto("/settings/notifications");
    await expect(page.getByRole("heading", { name: "Diagnostics" })).toBeVisible();
    await expect(page.getByText("Push keys (VAPID)")).toBeVisible();
    await expect(page.getByText("Not configured")).toBeVisible();
    await page.getByRole("button", { name: "Send a simulated test" }).click();
    await expect(status(page).filter({ hasText: /simulated/i })).toBeVisible();
    const n = await db.notification.findFirstOrThrow({ where: { category: "TEST" }, orderBy: { createdAt: "desc" } });
    expect(n.status).toBe("DELIVERED");
    expect(await db.pushDelivery.count({ where: { notificationId: n.id } })).toBe(0);
    await shot(page, "54-notification-diagnostics");
    await page.goto("/notifications");
    await expect(page.getByText(/test notification/i).first()).toBeVisible();
  });

  test("iOS splash screens and integrations status", async ({ page, request }) => {
    const r = await request.get("/splash/iphone-13-portrait.png");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
    await login(page);
    const links = await page.locator('link[rel="apple-touch-startup-image"]').count();
    expect(links).toBeGreaterThanOrEqual(5);
    await page.goto("/settings/integrations");
    await expect(page.getByText("Google Calendar (read-only import)")).toBeVisible();
    await expect(page.getByText("Not connected").first()).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("authorization: gig export and analytics require sign-in; export includes gig data", async ({ page, browser }) => {
    const anon = await browser.newContext();
    const r = await anon.request.get("/api/export/gig?kind=sessions&from=2026-01-01&to=2026-12-31", { maxRedirects: 0 });
    expect([302, 303, 307, 401]).toContain(r.status());
    const a = await anon.request.get("/analytics", { maxRedirects: 0 });
    expect([302, 303, 307]).toContain(a.status());
    await anon.close();
    await login(page);
    const body = await (await page.request.get("/api/export")).json();
    expect(body.version).toBe(5);
    expect(body.gig.workSessions.length).toBeGreaterThan(0);
    expect(body.gig.payouts.length).toBe(1);
    const text = JSON.stringify(body);
    for (const secret of ["passwordHash", "notesCipher", "p256dh", "DATA_ENCRYPTION_KEY", "BACKUP_PASSPHRASE"]) expect(text).not.toContain(secret);
  });
});
