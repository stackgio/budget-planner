import { expect, test, type Page } from "@playwright/test";

// Runs after app.spec.ts and money.spec.ts (alphabetical), on the same test database.
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
const dialog = (page: Page) => page.locator("dialog[open]").last();

test.describe.serial("Phase 3 — Goals & Personal Growth", () => {
  test("goals: create with milestones, complete one, progress persists after refresh", async ({ page }) => {
    await login(page);
    await page.goto("/goals");
    await expect(page.getByText("No goals yet")).toBeVisible();
    await page.getByRole("button", { name: "New goal" }).click();
    const d = dialog(page);
    await d.getByLabel("Goal", { exact: true }).fill("Finish year two at DOC strong");
    await d.getByLabel("Area").selectOption("CAREER");
    await d.getByLabel("Timeframe").selectOption("YEAR");
    await d.getByLabel("Milestones (one per line)").fill("Complete annual training\nUpdate resume");
    await d.getByRole("button", { name: "Create goal" }).click();
    await expect(page.getByRole("link", { name: /Finish year two at DOC strong/ })).toBeVisible();
    await page.getByRole("link", { name: /Finish year two at DOC strong/ }).click();
    await expect(page.getByText("0 of 2 milestones")).toBeVisible();
    await page.getByRole("button", { name: "Complete Complete annual training" }).click();
    await expect(page.getByText("1 of 2 milestones")).toBeVisible();
    await page.reload();
    await expect(page.getByText("50%")).toBeVisible();
    await expect(page.getByText("Status: active")).toBeVisible(); // never auto-completed
    await shot(page, "30-goal-detail");
    await noHorizontalScroll(page);
    await page.goto("/goals");
    await shot(page, "31-goals");
    await noHorizontalScroll(page);
  });

  test("fitness: schedule ≠ done; logging a workout counts it", async ({ page }) => {
    await login(page);
    await page.goto("/goals/fitness");
    await expect(page.getByText(/^0 \/ [0-3]$/)).toBeVisible(); // target may be eased by earlier activation tests
    await page.getByRole("button", { name: "Log workout" }).click();
    await page.getByRole("button", { name: "Full Body A (beginner)" }).click();
    const d = dialog(page);
    await d.getByLabel("Minutes").fill("40");
    await d.getByLabel("Bodyweight squat set 1 reps").fill("10");
    await d.getByRole("button", { name: "Log workout" }).click();
    await expect(status(page).filter({ hasText: "Workout logged" })).toBeVisible();
    await page.reload();
    await expect(page.getByText(/^1 \/ [0-3]$/)).toBeVisible();
    await expect(page.getByText("Full Body A (beginner)").first()).toBeVisible();
    await shot(page, "32-fitness");
    await noHorizontalScroll(page);
  });

  test("faith: private gratitude entry, supportive summary", async ({ page }) => {
    await login(page);
    await page.goto("/goals/faith");
    await page.getByRole("button", { name: /Gratitude/ }).click();
    await dialog(page).getByLabel("I'm grateful for…").fill("A safe shift and a quiet evening");
    await dialog(page).getByRole("button", { name: "Save" }).click();
    await expect(status(page).filter({ hasText: "Saved privately." })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByText("A safe shift and a quiet evening")).toBeVisible();
    await expect(page.getByText(/every one counts|most days/)).toBeVisible();
    await shot(page, "33-faith");
    await noHorizontalScroll(page);
  });

  test("relationship: plan letter A, mark it done explicitly, progress 1/26", async ({ page }) => {
    await login(page);
    await page.goto("/goals/relationship");
    await expect(page.getByText("0/26")).toBeVisible();
    await page.getByRole("button", { name: "Letter A, open" }).click();
    const d = dialog(page);
    await d.getByLabel("Activity for “A”").fill("Aquarium");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
    await d.getByLabel("Date", { exact: true }).fill(today); // a date can only be marked done on/after its day
    await d.getByLabel("Budget (optional)").fill("60");
    await d.getByRole("button", { name: "Plan date" }).click();
    await expect(page.getByText("Planned — mark it done from Upcoming after the date.")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByText("A · Aquarium")).toBeVisible();
    await expect(page.getByText("0/26")).toBeVisible(); // planned is not done
    await page.getByRole("button", { name: "Mark done" }).click();
    await dialog(page).getByLabel("What it cost (optional)").fill("54.25");
    await dialog(page).getByRole("button", { name: "Mark as done" }).click();
    await expect(page.getByText("1/26")).toBeVisible();
    await expect(page.getByText("$54.25").first()).toBeVisible();
    await shot(page, "34-relationship");
    await noHorizontalScroll(page);
  });

  test("education & career: checklist and an opportunity with entered pay", async ({ page }) => {
    await login(page);
    await page.goto("/goals/education");
    await expect(page.getByText("Exploring")).toBeVisible();
    await page.getByRole("button", { name: "Create returning-student checklist" }).click();
    await expect(page.getByRole("link", { name: /Return to Valencia College/ })).toBeVisible();
    await shot(page, "35-education");
    await noHorizontalScroll(page);
    await page.goto("/goals/career");
    await expect(page.getByText("$24.20/h")).toBeVisible();
    await page.getByRole("button", { name: "Add opportunity" }).click();
    const d = dialog(page);
    await d.getByLabel("Position").fill("Detention Deputy");
    await d.getByLabel("Agency").fill("County Sheriff's Office");
    await d.getByLabel("Pay min").fill("26.00");
    await d.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("+$3,744.00/yr")).toBeVisible();
    await shot(page, "36-career");
    await noHorizontalScroll(page);
  });

  test("growth: log speaking practice", async ({ page }) => {
    await login(page);
    await page.goto("/goals/growth");
    await page.getByRole("button", { name: "Log time" }).click();
    await dialog(page).getByLabel("Minutes").fill("15");
    await dialog(page).getByRole("button", { name: "Log time" }).click();
    await expect(status(page).filter({ hasText: "Logged." })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByText("15 min").first()).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("weekly review reflects stored data; reflection persists", async ({ page }) => {
    await login(page);
    await page.goto("/reviews");
    await expect(page.getByText("Everything below comes from what you recorded")).toBeVisible();
    await expect(page.getByText("1 gratitude")).toBeVisible();
    await page.getByLabel(/What went well/).fill("Good balance this week.");
    await page.getByLabel("Priority 1").fill("Schedule two workouts");
    await page.getByRole("button", { name: "Save review" }).click();
    await expect(status(page).filter({ hasText: "Review saved" })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/What went well/)).toHaveValue("Good balance this week.");
    await shot(page, "37-weekly-review");
    await noHorizontalScroll(page);
    await page.goto("/reviews/month");
    await expect(page.getByText("Monthly review")).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("home shows a concise growth overview", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coming up" })).toBeVisible();
    await shot(page, "38-home");
    await noHorizontalScroll(page);
  });

  test("export includes Phase 3 data (decrypted for the owner) and no credentials", async ({ page }) => {
    await login(page);
    const body = await (await page.request.get("/api/export")).json();
    for (const k of ["goals", "workouts", "faithEntries", "datePlans", "alphabet", "eduPrograms", "jobs", "activityLogs", "reviews", "bodyMetrics", "relationshipNotes", "reminderPreferences"]) expect(body).toHaveProperty(k);
    expect(body.faithEntries[0].body).toBe("A safe shift and a quiet evening");
    expect(body.reviews[0].reflection).toBe("Good balance this week.");
    const text = JSON.stringify(body);
    for (const secret of ["passwordHash", "publicKey", "\"sessions\"", "challenge\":\"", "bodyCipher", "reflectionCipher"]) expect(text).not.toContain(secret);
  });
});
