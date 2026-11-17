import { expect, test, type Page } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

// Runs last. Pre-launch security checks against the production build.
const EMAIL = "owner@example.test";
const PASSWORD = "correct horse battery staple";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hey Gio/ })).toBeVisible();
}

/** Every page and API route in the app, with dynamic segments filled in. */
function routes() {
  const root = path.resolve(__dirname, "../../src/app");
  const pages: string[] = [], apis: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = path.join(dir, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      const rel = path.relative(root, dir).split(path.sep).filter((s) => !/^\(.*\)$/.test(s)).map((s) => (s.startsWith("[") ? "x" : s));
      const url = "/" + rel.join("/");
      if (f === "page.tsx") pages.push(url === "/" ? "/" : url);
      if (f === "route.ts") apis.push(url);
    }
  };
  walk(root);
  return { pages, apis };
}
const PUBLIC_PAGES = ["/login", "/setup"];
const PUBLIC_APIS = ["/api/setup/restore", "/api/health", "/api/cron/tick", "/api/auth/passkey/login/options", "/api/auth/passkey/login/verify"];

test.describe.serial("Pre-launch security", () => {
  test("every private page and API requires sign-in", async ({ browser }) => {
    const { pages, apis } = routes();
    expect(pages.length).toBeGreaterThan(25);
    const anon = await browser.newContext();
    for (const p of pages.filter((x) => !PUBLIC_PAGES.includes(x))) {
      const r = await anon.request.get(p, { maxRedirects: 0 });
      expect([307, 308], `${p} → ${r.status()}`).toContain(r.status());
      expect(r.headers()["location"], p).toContain("/login");
    }
    for (const a of apis.filter((x) => !PUBLIC_APIS.includes(x))) {
      for (const method of ["GET", "POST", "DELETE"] as const) {
        const r = await anon.request.fetch(a, { method, maxRedirects: 0 });
        expect([401, 405], `${method} ${a} → ${r.status()}`).toContain(r.status());
      }
    }
    // A forged cookie gets nothing either (validated against the database, not just present).
    await anon.addCookies([{ name: "lu_session", value: "forged-token-value", url: "http://localhost:3101" }]);
    const p = await anon.newPage();
    await p.goto("/money");
    await expect(p).toHaveURL(/\/login/);
    expect((await anon.request.get("/api/export")).status()).toBe(401);
    await anon.close();
  });

  test("CSP: nonce'd scripts only, no violations while using the app, injected scripts are blocked", async ({ page }) => {
    const violations: string[] = [];
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        (window as unknown as { __csp: string[] }).__csp = [...((window as unknown as { __csp?: string[] }).__csp ?? []), `${e.violatedDirective} ${e.blockedURI}`];
      });
    });
    page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
    const res = await page.goto("/login");
    const csp = res!.headers()["content-security-policy"]!;
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    const nonce = /'nonce-([^']+)'/.exec(csp)![1]!;
    const scripts = await page.locator("script[src]").evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).nonce));
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every((n) => n === nonce)).toBe(true);
    await login(page);
    for (const p of ["/", "/calendar", "/tasks", "/money", "/money/roulette", "/money/gig", "/analytics", "/goals", "/assistant", "/notifications", "/settings", "/settings/notifications", "/reviews"]) {
      await page.goto(p);
      await expect(page.locator("main")).toBeVisible();
    }
    await page.getByRole("link", { name: /Notifications/ }).first().click(); // client-side navigation still works
    // An HTML-injection attack: markup with an inline handler and an inline <script>. Both must be refused.
    const injected = await page.evaluate(async () => {
      const div = document.createElement("div");
      div.innerHTML = `<img src="/does-not-exist.png" onerror="window.__pwned = true"><iframe srcdoc="<script>parent.__pwned2 = true<\/script>"></iframe>`;
      document.body.appendChild(div);
      await new Promise((r) => setTimeout(r, 300));
      const w = window as unknown as { __pwned?: boolean; __pwned2?: boolean };
      return w.__pwned === true || w.__pwned2 === true;
    });
    expect(injected).toBe(false);
    const recorded = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
    // The only violations are the ones caused by our deliberate injection.
    expect(recorded.filter((v) => !/inline|frame|does-not-exist/.test(v))).toEqual([]);
    expect(recorded.length).toBeGreaterThan(0);
    expect(violations.filter((v) => !/inline|frame|onerror|srcdoc/i.test(v))).toEqual([]);
  });

  test("private data is never cached by the service worker or the browser", async ({ page, request }) => {
    const sw = await (await request.get("/sw.js")).text();
    expect(sw).not.toMatch(/addEventListener\(\s*["']fetch["']/);
    expect(sw).not.toMatch(/caches\.open|cache\.put|cache\.add/);
    await login(page);
    for (const p of ["/money", "/money/gig", "/analytics"]) {
      const r = await page.goto(p);
      expect(r!.headers()["cache-control"], p).toMatch(/no-store/);
    }
    const exp = await page.request.get("/api/export");
    expect(exp.headers()["cache-control"]).toContain("no-store");
    await page.evaluate(() => navigator.serviceWorker?.ready);
    expect(await page.evaluate(async () => ("caches" in window ? (await caches.keys()).length : 0))).toBe(0);
  });

  test("session cookie flags; sign-out invalidates the session server-side", async ({ page, context }) => {
    await login(page);
    const c = (await context.cookies()).find((x) => x.name === "lu_session")!;
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe("Lax");
    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await context.addCookies([{ name: c.name, value: c.value, url: "http://localhost:3101" }]); // replay the old token
    await page.goto("/money");
    await expect(page).toHaveURL(/\/login/);
  });

  test("registration is closed once the owner exists", async ({ page, request }) => {
    const r = await request.get("/setup", { maxRedirects: 0 });
    expect([307, 308]).toContain(r.status());
    await page.goto("/setup");
    await expect(page).toHaveURL(/\/login/);
  });
});
