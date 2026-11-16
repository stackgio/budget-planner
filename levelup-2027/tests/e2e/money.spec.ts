import { expect, test, type Page } from "@playwright/test";

// Runs after app.spec.ts (same database, owner already created there).
const EMAIL = "owner@example.test";
const PASSWORD = "correct horse battery staple";
const SHOTS = process.env.SCREENSHOT_DIR;

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
const status = (page: Page) => page.locator("p[role=status]");

test.describe.serial("Phase 2 — Money System", () => {
  test("money dashboard starts empty and honest", async ({ page }) => {
    await login(page);
    await page.goto("/money");
    await expect(page.getByText("Confirmed money not yet allocated")).toBeVisible();
    await expect(page.getByText("Ledger reconciled")).toBeVisible();
    await expect(page.getByText("Setup required").first()).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("overtime deposit → spin → reroll → refresh → approve → confirm transfers", async ({ page }) => {
    await login(page);
    // Record an actual overtime deposit (net, not gross).
    await page.goto("/money/overtime");
    await page.getByRole("button", { name: "Record deposit" }).first().click();
    await page.getByLabel("Net amount deposited").fill("612.40");
    await page.getByRole("button", { name: "Confirm deposit" }).click();
    await expect(page.getByText("$612.40 on Mon, Nov 16").first()).toBeVisible();

    await page.goto("/money/roulette");
    await page.getByRole("link", { name: /Overtime deposit/ }).first().click();
    await expect(page.getByText("$612.40").first()).toBeVisible();
    await page.getByRole("button", { name: /SPIN MY OVERTIME/ }).click();
    await expect(page.getByText("Draft proposal · nothing reserved or moved")).toBeVisible();
    await expect(page.getByRole("region", { name: "Proposed allocation" }).getByText("Roth IRA", { exact: true })).toBeVisible();
    await expect(page.getByText("Your free money")).toBeVisible();

    // Reroll and refresh: still a single draft, nothing reserved.
    await page.getByRole("button", { name: /REROLL/ }).click();
    await expect(status(page).filter({ hasText: "Nothing has been reserved" })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Draft proposal · nothing reserved or moved")).toBeVisible();
    await expect(page.locator("header").getByText("$0.00").first()).toBeVisible(); // reserved $0 while a draft
    await shot(page, "20-roulette-draft");
    await noHorizontalScroll(page);

    await page.getByRole("button", { name: "Approve plan" }).click();
    await expect(page).toHaveURL(/\/money\/plans\//);
    await expect(page.getByText("Reserved · not paid").first()).toBeVisible();

    // Confirm the Roth line; double-tapping the submit records it once.
    await page.getByRole("button", { name: "I made this transfer" }).first().click();
    const confirm = page.getByRole("button", { name: "Confirm transfer" });
    await confirm.dblclick();
    await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();
    // Confirm a challenge tile line too.
    await page.getByRole("button", { name: "I made this transfer" }).last().click();
    await page.getByRole("button", { name: "Confirm transfer" }).click();
    await expect(page.getByText("Confirmed", { exact: true })).toHaveCount(2);
    await page.reload();
    await expect(page.getByText("Confirmed", { exact: true })).toHaveCount(2);
    await shot(page, "21-plan-confirmations");
    await noHorizontalScroll(page);

    const body = await (await page.request.get("/api/export")).json();
    expect(body.payments).toHaveLength(2); // the double tap did not duplicate
    expect(body.deposits).toHaveLength(1);
  });

  test("challenge tiles reflect only confirmed transfers", async ({ page }) => {
    await login(page);
    await page.goto("/money/challenges");
    await expect(page.getByText("Contribution history")).toBeVisible();
    await expect(page.locator('li[aria-label*="completed"]')).toHaveCount(1);
    await shot(page, "22-challenge-tiles");
    await noHorizontalScroll(page);
  });

  test("SCHD history: verify Days 1–3 in a reviewed batch", async ({ page }) => {
    await login(page);
    await page.goto("/money/challenges/schd-import");
    for (const n of [1, 2, 3]) await page.getByRole("button", { name: `Day ${n}`, exact: true }).click();
    await expect(page.getByText("3 days selected · $6.00")).toBeVisible();
    await page.getByRole("button", { name: /Review 3 contributions/ }).click();
    await page.getByLabel("When (best known date)").fill("2026-06-01");
    await page.getByLabel("I checked these against my records").check();
    await page.getByRole("button", { name: "Verify 3 days" }).click();
    await expect(status(page).filter({ hasText: "3 days verified." })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Day 1, already verified" })).toBeDisabled();
  });

  test("debt setup validates the mapping before it can join Roulette", async ({ page }) => {
    await login(page);
    await page.goto("/money/challenges/debt");
    await page.getByLabel("Current balance").fill("2000");
    await page.getByLabel("Challenge target").fill("1275");
    await expect(page.getByText("50 tiles adding up to $1,275.00")).toBeVisible();
    await expect(page.getByText("✓ matches the target")).toBeVisible();
    await page.getByRole("button", { name: "Save debt challenge" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("tick the confirmation box");
    await page.getByLabel("I reviewed the balance and tiles").check();
    await page.getByRole("button", { name: "Save debt challenge" }).click();
    await expect(status(page).filter({ hasText: "50 tiles" })).toBeVisible();
    await page.goto("/money/challenges");
    await expect(page.getByLabel("Debt tiles")).toBeVisible();
  });

  test("Extra Paycheck Planner: April forecast with dollars, percent and a spin", async ({ page }) => {
    await login(page);
    await page.goto("/money/extra");
    await page.getByRole("link", { name: /Plan April/ }).click();
    await page.getByLabel(/Amount you expect to have free/).fill("1200");
    await page.getByRole("button", { name: "Start plan" }).click();
    await page.getByRole("button", { name: "Adjust" }).click();
    await page.getByLabel("What").selectOption("EMERGENCY");
    await page.locator("input[name=value]").fill("300");
    await page.getByRole("button", { name: "Save amount" }).click();
    await expect(page.getByText("Emergency savings").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByLabel(/Amount for challenge tiles/).fill("250");
    await page.getByRole("button", { name: /SPIN MY EXTRA PAYCHECK/ }).click();
    await expect(page.getByText(/Moving-Out · Tile #|SCHD · Day|Debt · Tile #/).first()).toBeVisible();
    await expect(page.getByText(/This is a forecast/)).toBeVisible(); // can't approve without a real deposit
    await expect(page.getByRole("region", { name: "Proposed allocation" }).getByText("Roth IRA", { exact: true })).toHaveCount(0); // no overtime defaults applied
    await shot(page, "23-extra-paycheck-planner");
    await noHorizontalScroll(page);
  });

  test("Roth IRA: user-configured limit, confirmed vs planned", async ({ page }) => {
    await login(page);
    await page.goto("/money/roth?year=2026");
    await page.getByLabel("Annual limit").fill("7000");
    await page.getByLabel("Source / note").fill("entered by me for testing");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(status(page).filter({ hasText: "2026 limit saved." })).toBeVisible();
    await expect(page.getByText("$100.00").first()).toBeVisible(); // the Roth line confirmed earlier
    await shot(page, "24-roth");
    await page.goto("/money");
    await expect(page.getByText("Ledger reconciled")).toBeVisible();
    await shot(page, "25-money-dashboard");
    await noHorizontalScroll(page);
  });
});
