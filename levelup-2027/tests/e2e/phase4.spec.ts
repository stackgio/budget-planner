import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Runs last (alphabetical) on the shared test database. No real push is ever sent: push is not configured.
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
const status = (page: Page) => page.locator("p[role=status]");
const dialog = (page: Page) => page.locator("dialog[open]").last();

test.describe.serial("Phase 4 — Assistant, reminders & notifications", () => {
  test("morning briefing and Ask answer from stored records", async ({ page }) => {
    await login(page);
    await page.goto("/assistant");
    await expect(page.getByText("Good morning ☀️")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Paydays (next 7 days)" })).toBeVisible();
    await shot(page, "40-assistant-morning");
    await noHorizontalScroll(page);
    await page.goto("/assistant?tab=ask");
    await page.getByRole("button", { name: "When is my next projected payday?" }).click();
    const answer = page.getByRole("region", { name: "Answer" });
    await expect(answer.getByRole("heading", { name: "Next projected paydays" })).toBeVisible();
    await expect(answer).toContainText("projected from your unverified anchor");
    await page.getByLabel("Question").fill("What's the weather?");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(answer.getByRole("heading", { name: "I can help with these" })).toBeVisible();
    await page.getByRole("button", { name: "What financial transfers are still waiting?" }).click();
    await expect(answer.getByRole("heading", { name: /waiting/ })).toBeVisible();
    await shot(page, "41-assistant-ask");
    await noHorizontalScroll(page);
  });

  test("check-in: completing a task requires a tap; dismiss changes nothing", async ({ page }) => {
    await login(page);
    await page.goto("/tasks?new=1");
    await page.getByLabel("Title").fill("Return library book");
    await page.getByRole("button", { name: "Add task" }).last().click();
    await page.keyboard.press("Escape");
    await page.goto("/assistant?tab=checkin");
    await expect(page.getByText("Return library book")).toBeVisible();
    await shot(page, "42-assistant-checkin");
    await page.getByRole("button", { name: "Complete Return library book" }).click();
    await expect(page.getByText("Return library book")).toBeHidden();
    await noHorizontalScroll(page);
  });

  test("evening reflection saves privately and persists", async ({ page }) => {
    await login(page);
    await page.goto("/assistant?tab=evening");
    await expect(page.getByRole("heading", { name: "Today you…" })).toBeVisible();
    await page.getByLabel("What went well today?").fill("Stayed patient on a long shift");
    await page.getByRole("button", { name: "Save reflection" }).click();
    await expect(status(page).filter({ hasText: "Saved privately" })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("What went well today?")).toHaveValue("Stayed patient on a long shift");
    await shot(page, "43-assistant-evening");
    const row = await db.dailyReflection.findFirstOrThrow();
    expect(row.answersCipher).not.toContain("patient");
  });

  test("notification center: bell count, read, snooze, dismiss, history", async ({ page }) => {
    const owner = await db.user.findFirstOrThrow({ where: { email: EMAIL } });
    const now = Date.now();
    const mk = (key: string, category: string, priority: "IMPORTANT" | "NORMAL", preview: string) => db.notification.create({
      data: { ownerId: owner.id, kind: "REMINDER", category, priority, title: "LEVEL UP", preview, href: "/money/roulette", dedupeKey: `e2e:${key}`, scheduledFor: new Date(now - 60_000), expiresAt: new Date(now + 6 * 3_600_000), status: "DELIVERED", deliveredAt: new Date(now - 60_000) },
    });
    await mk("roth", "ROTH", "IMPORTANT", "A planned contribution is waiting for confirmation.");
    await mk("review", "REVIEW", "NORMAL", "Your review is ready when you are.");
    await mk("workout", "WORKOUT", "NORMAL", "You have a workout planned.");
    await login(page);
    await expect(page.getByRole("link", { name: /Notifications, \d+ unread/ })).toBeVisible();
    await page.getByRole("link", { name: /Notifications, \d+ unread/ }).click();
    await expect(page.getByRole("heading", { name: "Notification center" })).toBeVisible();
    await expect(page.getByText("important")).toBeVisible();
    await shot(page, "44-notification-center");
    await noHorizontalScroll(page);
    const items = page.getByRole("list", { name: "Notifications" }).getByRole("listitem");
    await items.filter({ hasText: "workout planned" }).getByRole("button", { name: "Snooze 1h" }).click();
    await expect(items.filter({ hasText: "workout planned" }).getByText("snoozed", { exact: true })).toBeVisible();
    await items.filter({ hasText: "review is ready" }).getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByText("Your review is ready when you are.")).toBeHidden();
    await page.getByRole("button", { name: "Mark all read" }).click();
    await expect(page.getByRole("link", { name: "Notifications", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Your review is ready when you are.")).toBeHidden();
    await page.getByRole("link", { name: "Show history" }).click();
    await expect(page.getByText("Your review is ready when you are.")).toBeVisible();
    await expect(page.getByText("dismissed")).toBeVisible();
  });

  test("notification settings persist; push shows not-configured (no real push)", async ({ page, context }) => {
    // Headless Chromium reports "denied" by default; simulate a browser where you haven't been asked yet.
    await context.addInitScript(() => { Object.defineProperty(Notification, "permission", { get: () => "default" }); });
    await login(page);
    await page.goto("/settings/notifications");
    await expect(page.locator("[data-push-state]")).toHaveAttribute("data-push-state", "not-configured");
    await page.getByRole("checkbox", { name: "Workouts", exact: true }).first().uncheck(); // reminder type (first); the briefing section has the same label
    await page.getByLabel("Overtime mode").selectOption("ALL");
    await page.getByRole("button", { name: "Save notification settings" }).click();
    await expect(status(page).filter({ hasText: "Saved." })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Workouts", exact: true }).first()).not.toBeChecked();
    await expect(page.getByLabel("Overtime mode")).toHaveValue("ALL");
    await expect(page.getByLabel(/Show details on the lock screen/)).not.toBeChecked();
    await shot(page, "45-notification-settings");
    await noHorizontalScroll(page);
  });

  test("push permission denied is handled gracefully", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => { Object.defineProperty(Notification, "permission", { get: () => "denied" }); });
    const page = await context.newPage();
    await login(page);
    await page.goto("/settings/notifications");
    await expect(page.locator("[data-push-state]")).toHaveAttribute("data-push-state", "denied");
    await expect(page.getByText("Notifications are blocked for this site")).toBeVisible();
    await context.close();
  });

  test("workout routine editor: edit, add an exercise, duplicate", async ({ page }) => {
    await login(page);
    await page.goto("/goals/fitness");
    const card = page.locator("li", { hasText: "Full Body B (beginner)" }).first();
    await card.getByRole("button", { name: "Edit" }).click();
    const d = dialog(page);
    await d.getByLabel("Workout name").fill("Full Body B — garage");
    await d.getByLabel("Type").selectOption("GYM");
    await d.getByRole("button", { name: "Add exercise" }).click();
    await d.getByLabel("Weight or resistance").last().fill("20 lb");
    await d.getByRole("button", { name: "Save workout" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0); // the sheet closes once saved
    await expect(page.locator("li", { hasText: "Full Body B — garage" }).first()).toBeVisible();
    await page.locator("li", { hasText: "Full Body B — garage" }).first().getByRole("button", { name: "Duplicate" }).click();
    await expect(page.getByText("Full Body B — garage (copy)")).toBeVisible();
    await shot(page, "46-workout-editor");
  });

  test("education: edit and archive a course", async ({ page }) => {
    await login(page);
    await page.goto("/goals/education");
    await page.getByRole("button", { name: "Add" }).first().click();
    await dialog(page).getByLabel("Title").fill("Intro to Criminal Justice");
    await dialog(page).getByRole("button", { name: "Save course" }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    const row = page.locator("li", { hasText: "Intro to Criminal Justice" });
    await row.getByRole("button", { name: "Edit" }).click();
    await dialog(page).getByLabel("Status").selectOption("REGISTERED");
    await dialog(page).getByRole("button", { name: "Save course" }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.locator("li", { hasText: "Intro to Criminal Justice" }).getByText("registered")).toBeVisible();
    await page.locator("li", { hasText: "Intro to Criminal Justice" }).getByRole("button", { name: "Archive" }).click();
    await expect(page.getByRole("heading", { name: "Archived" })).toBeVisible();
  });

  test("PWA assets, encryption status and export completeness", async ({ page, request }) => {
    const sw = await request.get("/sw.js");
    expect(sw.status()).toBe(200);
    expect(await sw.text()).toContain("notificationclick");
    await login(page);
    const manifest = await (await page.request.get("/manifest.webmanifest")).json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    await page.goto("/settings");
    await expect(page.getByText("Your encryption key matches your private notes.")).toBeVisible();
    const body = await (await page.request.get("/api/export")).json();
    for (const k of ["notificationPreferences", "notifications", "pushDevices", "dailyReflections", "assistantDismissals"]) expect(body).toHaveProperty(k);
    expect(body.dailyReflections[0].answers).toContain("Stayed patient");
    const text = JSON.stringify(body);
    for (const secret of ["passwordHash", "p256dh", "\"endpoint\"", "DATA_ENCRYPTION_KEY", "detailCipher", "answersCipher"]) expect(text).not.toContain(secret);
  });
});
