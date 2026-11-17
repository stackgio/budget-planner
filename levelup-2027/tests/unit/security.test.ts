import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { clientKeyFrom } from "@/server/auth";
import { buildCsp } from "@/proxy";

describe("client key behind a proxy", () => {
  it("never trusts the client-supplied (leftmost) X-Forwarded-For value", () => {
    expect(clientKeyFrom("6.6.6.6, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(clientKeyFrom("1.1.1.1, 2.2.2.2, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(clientKeyFrom("203.0.113.9", 1)).toBe("203.0.113.9");
  });
  it("falls back safely", () => {
    expect(clientKeyFrom("anything", 0)).toBe("direct");
    expect(clientKeyFrom(null, 1)).toBe("unknown");
    expect(clientKeyFrom("<script>", 1)).toBe("unknown");
    expect(clientKeyFrom("2001:db8::1", 1)).toBe("2001:db8::1");
  });
});

describe("Content-Security-Policy", () => {
  const prod = buildCsp("abc123", { dev: false, https: true });
  it("allows only nonce'd scripts in production, no eval, no framing, no plugins", () => {
    expect(prod).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(prod).not.toContain("unsafe-eval");
    expect(prod).not.toMatch(/script-src[^;]*unsafe-inline/);
    for (const d of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "connect-src 'self'", "worker-src 'self'", "upgrade-insecure-requests"]) expect(prod).toContain(d);
  });
  it("adds dev-only allowances only in development, and https upgrades only over https", () => {
    const dev = buildCsp("n", { dev: true, https: false });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });
});

describe("every server action requires a signed-in user", () => {
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f)) files.push(p); } };
  walk(path.resolve(__dirname, "../../src/app"));
  const actionFiles = files.filter((f) => /^["']use server["']/.test(readFileSync(f, "utf8").trimStart()));
  it("finds the action files", () => expect(actionFiles.length).toBeGreaterThanOrEqual(10));
  for (const f of actionFiles) {
    it(path.relative(path.resolve(__dirname, "../.."), f), () => {
      const src = readFileSync(f, "utf8");
      const fns = [...src.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g)];
      expect(fns.length).toBeGreaterThan(0);
      for (const [, name, body] of fns) {
        if (/auth-actions\.ts$/.test(f) && ["loginAction", "setupAction", "logoutAction"].includes(name!)) continue; // public by design
        expect(body, `${name} must call requireUser()`).toMatch(/await requireUser\(\)/);
      }
    });
  }
});

import webpush from "web-push";
import { generateLaunchSecrets } from "@/domain/secrets";
import { keyFromSecret } from "@/server/crypto";

describe("on-phone secret generator", () => {
  it("produces values the app and web-push accept, and they differ every time", async () => {
    const a = Object.fromEntries((await generateLaunchSecrets()).map((s) => [s.name, s.value]));
    const b = Object.fromEntries((await generateLaunchSecrets()).map((s) => [s.name, s.value]));
    expect(keyFromSecret(a.DATA_ENCRYPTION_KEY!)!.length).toBe(32);
    expect(a.DATA_ENCRYPTION_KEY!.length).toBe(64);
    expect(a.BACKUP_PASSPHRASE!.length).toBeGreaterThanOrEqual(40);
    expect(() => webpush.setVapidDetails("https://levelup.example", a.VAPID_PUBLIC_KEY!, a.VAPID_PRIVATE_KEY!)).not.toThrow();
    const details = webpush.generateRequestDetails({ endpoint: "https://push.example/x", keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } }, "x", { vapidDetails: { subject: "https://levelup.example", publicKey: a.VAPID_PUBLIC_KEY!, privateKey: a.VAPID_PRIVATE_KEY! } });
    expect(String(details.headers.Authorization)).toMatch(/^vapid t=/);
    for (const k of Object.keys(a)) expect(a[k]).not.toBe(b[k]);
  });
});
