import { expect, test, type Page } from "@playwright/test";

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
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe.serial("LEVEL UP 2027 — Phase 1", () => {
  test("first run: protected routes redirect, setup creates the single owner", async ({ page, request }) => {
    expect((await request.get("/api/export", { maxRedirects: 0 })).status()).toBe(401);
    await page.goto("/calendar");
    await expect(page).toHaveURL(/\/setup$/);
    // On-phone secret generator (values made in the browser, never sent to the server).
    await page.getByText("First time? Generate your secrets").click();
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-secret]")).toHaveCount(5);
    expect((await page.locator('[data-secret="DATA_ENCRYPTION_KEY"]').textContent())!.length).toBe(64);
    // Launch check runs before any personal information and needs the setup token.
    await page.getByText("Launch check (run before creating your account)").click();
    await page.getByLabel("Setup token (for the check)").fill("wrong-token");
    await page.getByRole("button", { name: "Run launch check" }).click();
    await expect(page.getByText("Setup token is incorrect.")).toBeVisible();
    await page.getByLabel("Setup token (for the check)").fill(process.env.SETUP_TOKEN!);
    await page.getByRole("button", { name: "Run launch check" }).click();
    await expect(page.locator('[data-check="migrations"][data-ok="true"]')).toBeVisible();
    await expect(page.locator('[data-check="https"][data-ok="false"]')).toBeVisible(); // local http, as expected
    await page.locator("input[name=token]").fill("wrong");
    await page.getByLabel("Your name").fill("Gio");
    await page.getByLabel("Email").fill(EMAIL);
    await page.locator("input[name=password]").fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("Setup token is incorrect");
    await page.locator("input[name=token]").fill("test-setup-token");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: /Hey Gio/ })).toBeVisible();
    await shot(page, "01-home");
    await noHorizontalScroll(page);
    // setup is closed forever after the first account
    await page.goto("/setup");
    await expect(page).not.toHaveURL(/\/setup$/);
  });

  test("wrong password is rejected; correct password signs in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill("not the password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("p[role=alert]")).toContainText("incorrect");
    await login(page);
  });

  test("calendar: DOC series, single-shift edit persists after refresh", async ({ page }) => {
    await login(page);
    await page.goto("/calendar?view=month&date=2027-04-01");
    await expect(page.getByText("Extra paycheck month 💰")).toBeVisible();
    await shot(page, "02-calendar-month-april-2027");
    await noHorizontalScroll(page);

    await page.goto("/calendar?view=agenda&date=2027-03-08");
    await page.getByRole("button", { name: /DOC shift/ }).first().click();
    await expect(page.getByText("This is a repeating event")).toBeVisible();
    await page.getByText("This event", { exact: true }).click();
    await page.getByLabel("Title").fill("DOC double shift");
    await page.getByLabel("End time").fill("20:00");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.reload();
    const mar8 = page.locator("section", { hasText: "Monday, March 8, 2027" });
    await expect(mar8.getByText("DOC double shift")).toBeVisible();
    const mar9 = page.locator("section", { hasText: "Tuesday, March 9, 2027" });
    await expect(mar9.getByText("DOC shift", { exact: true })).toBeVisible();
    await expect(mar8.getByText("edited")).toBeVisible();
    await shot(page, "03-calendar-agenda-exception");
  });

  test("calendar: create an event with conflict warning, persists after refresh", async ({ page }) => {
    await login(page);
    await page.goto("/calendar?view=day&date=2027-03-10");
    await page.getByRole("button", { name: "Add event", exact: true }).click();
    await page.getByLabel("Title").fill("Valencia advisor appointment");
    await page.getByLabel("Category").selectOption("APPOINTMENT");
    await page.getByLabel("Start date").fill("2027-03-10");
    await page.getByLabel("Start time").fill("15:00");
    await page.getByLabel("End time").fill("16:30");
    await expect(page.getByText("Overlaps with:")).toBeVisible();
    await shot(page, "04-event-editor-conflict");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.reload();
    await expect(page.getByRole("button", { name: /Valencia advisor appointment/ })).toBeVisible();
    await shot(page, "05-calendar-day");
  });

  test("tasks: add, persist, complete", async ({ page }) => {
    await login(page);
    await page.goto("/tasks?new=1");
    await page.getByLabel("Title").fill("Request Valencia transcript");
    await page.getByRole("button", { name: "Add task" }).last().click();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByText("Request Valencia transcript")).toBeVisible();
    await page.getByRole("button", { name: "Complete Request Valencia transcript" }).click();
    await expect(page.getByRole("button", { name: "Complete Request Valencia transcript" })).toBeHidden();
    await page.goto("/tasks?view=completed");
    await expect(page.getByText("Request Valencia transcript")).toBeVisible();
    await page.goto("/tasks?tab=habits");
    await page.getByRole("button", { name: /^Prayer on .*not done/ }).last().click();
    await expect(page.getByRole("button", { name: /^Prayer on .*done, tap to undo/ })).toHaveCount(1);
    await shot(page, "06-habits");
  });

  test("payroll: provisional schedule, April/October extra months, deposits only on confirmation", async ({ page }) => {
    await login(page);
    await page.goto("/money/payroll?year=2027");
    await expect(page.getByText("Provisional · unverified")).toBeVisible();
    await expect(page.getByText("$0.00").first()).toBeVisible();
    await shot(page, "07-regular-payroll");
    await noHorizontalScroll(page);
    await page.goto("/money/extra");
    const april = page.locator("article", { hasText: "April 2027" });
    await expect(april).toContainText("Fri, Apr 2");
    await expect(april).toContainText("Fri, Apr 16");
    await expect(april).toContainText("Fri, Apr 30");
    const october = page.locator("article", { hasText: "October 2027" });
    await expect(october).toContainText("Fri, Oct 1");
    await expect(october).toContainText("Est. deposit Thu, Sep 30");
    await shot(page, "08-extra-paycheck");
    await page.goto("/money/challenges");
    await expect(page.getByText("$10,011.00")).toHaveCount(2); // target and remaining (confirmed is $0)
    await expect(page.getByText("Day 38")).toBeVisible();
    await expect(page.getByText("Setup required").first()).toBeVisible();
    await shot(page, "09-challenges");
  });

  test("overtime: log a shift with estimated gross", async ({ page }) => {
    await login(page);
    await page.goto("/money/overtime?new=1");
    await page.getByLabel("Shift date").fill("2026-11-14");
    await page.getByLabel("Hours at regular rate").fill("0");
    await page.getByLabel(/Hours at 1.5× rate/).fill("8");
    await expect(page.getByText("$290.40")).toBeVisible();
    await page.getByRole("button", { name: "Log shift" }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByText(/8 h OT · est. gross \$290.40/)).toBeVisible();
    await shot(page, "10-overtime");
  });

  test("activation: start, review conflicts, return to normal", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: /I've Been Activated/ }).click();
    await page.getByRole("button", { name: "Start activation" }).click();
    await expect(page).toHaveURL(/\/modes\//);
    await expect(page.getByText("Activated mode · optional reminders paused")).toBeVisible();
    await shot(page, "11-activation");
    await page.getByRole("button", { name: "End & start recovery" }).click();
    await expect(page.getByText("Recovery mode")).toBeVisible();
    await page.getByRole("button", { name: "Back to normal" }).first().click();
    await expect(page.getByText("Recovery mode")).toBeHidden();
  });

  test("passkey: register with a virtual authenticator, then sign in with it", async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
    });
    await login(page);
    await page.goto("/settings");
    await page.getByLabel("Device name").fill("Test device");
    await page.getByRole("button", { name: "Add a passkey" }).click();
    await expect(page.getByText("Passkey added")).toBeVisible();
    await expect(page.getByText(/Test device/)).toBeVisible();
    await shot(page, "12-settings");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole("button", { name: "Sign in with a passkey" }).click();
    await expect(page.getByRole("heading", { name: /Hey Gio/ })).toBeVisible();
  });

  test("export requires auth and contains data", async ({ page }) => {
    await login(page);
    const res = await page.request.get("/api/export");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.format).toBe("levelup-2027-export");
    expect(body.challenges).toHaveLength(3);
    expect(body.deposits).toHaveLength(0);
    expect(body.payments).toEqual([]);
  });
});
