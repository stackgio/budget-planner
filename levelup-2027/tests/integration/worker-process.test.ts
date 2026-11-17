import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { freshOwner } from "./helpers";

// Runs the real worker entrypoint as production does (a separate Node process), catching import-time crashes.
describe("worker process", () => {
  it("starts, runs one tick (reminders + housekeeping + daily backup) and exits cleanly", async () => {
    await freshOwner();
    const dir = mkdtempSync(path.join(tmpdir(), "lu-worker-"));
    try {
      const r = spawnSync("npx", ["tsx", "--conditions=react-server", "scripts/worker.ts", "--once"], {
        env: { ...process.env, BACKUP_PASSPHRASE: "worker process test passphrase", BACKUP_DIR: dir }, encoding: "utf8", timeout: 120_000,
      });
      expect(r.status, r.stderr).toBe(0);
      expect(r.stdout).toMatch(/created \d+ · delivered/);
      expect(r.stderr).not.toMatch(/TypeError|Cannot find module/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
