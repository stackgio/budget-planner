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
const status = (page: Page) => page.locator("p[role=status]");

test.describe.serial("Pre-launch: backups & recovery on iPhone", () => {
  test("back up now, see it listed, save a copy, and run a restore test", async ({ page }) => {
    await login(page);
    await page.goto("/settings");
    await page.getByRole("link", { name: "Backups" }).click();
    await expect(page.getByRole("heading", { name: "Backups & recovery" })).toBeVisible();
    await expect(page.getByText("Set (never shown)")).toBeVisible();
    await expect(page.getByText("Matches your private notes")).toBeVisible();
    await page.getByRole("button", { name: "Back up now" }).click();
    await expect(status(page).filter({ hasText: /Backup saved and verified/ })).toBeVisible({ timeout: 30_000 });
    await page.reload();
    const save = page.getByRole("link", { name: /Download backup from/ }).first();
    await expect(save).toBeVisible();
    const href = await save.getAttribute("href");
    const file = await page.request.get(href!);
    expect(file.status()).toBe(200);
    expect(file.headers()["cache-control"]).toContain("no-store");
    const body = await file.body();
    expect(body.subarray(0, 60).toString()).toContain('"format":"levelup-backup"');
    expect(body.includes(Buffer.from(EMAIL))).toBe(false); // encrypted
    await page.reload();
    await expect(page.getByText(/Last saved to your iPhone/).locator("..")).not.toContainText("Never");
    await page.getByRole("button", { name: "Test restore" }).click();
    await expect(status(page).filter({ hasText: /Restore test passed/ })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Keep these two secrets safe")).toBeVisible();
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/60-backups.png`, fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test("backup downloads and disaster restore require the owner / an empty installation", async ({ browser }) => {
    const anon = await browser.newContext();
    expect((await anon.request.get("/api/backups/download?key=levelup-20270101T000000Z.lubk")).status()).toBe(401);
    const r = await anon.request.post("/api/setup/restore", { headers: { origin: "http://localhost:3101" }, multipart: { token: "x", passphrase: "y" } });
    expect(r.status()).toBe(403);
    expect((await r.json()).error).toMatch(/already set up/);
    await anon.close();
  });

  test("Home Screen app: manifest, icon, full-screen, splash", async ({ page, request }) => {
    const m = await (await request.get("/manifest.webmanifest")).json();
    expect(m).toMatchObject({ display: "standalone", start_url: "/" });
    expect((await request.get("/apple-touch-icon.png")).headers()["content-type"]).toContain("image/png");
    await page.goto("/login");
    expect(await page.locator('meta[name="apple-mobile-web-app-capable"], meta[name="mobile-web-app-capable"]').count()).toBeGreaterThan(0);
    expect(await page.locator('link[rel="apple-touch-icon"]').count()).toBeGreaterThan(0);
    expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBe(11);
    expect(await page.locator('meta[name="viewport"]').getAttribute("content")).toContain("viewport-fit=cover");
  });
});
