import { prisma } from "@/server/db";
import { assertSameOrigin, beginAttempt, clientKey, finishAttempt, safeEqual } from "@/server/auth";
import { disasterRestore } from "@/server/backup-service";
import { env } from "@/server/env";

export const dynamic = "force-dynamic";
const MAX_BYTES = 200 * 1024 * 1024;

/**
 * Disaster recovery on a brand-new, EMPTY installation only. Requires SETUP_TOKEN (server secret) and the
 * backup passphrase. Restores into a NEW database; nothing existing is overwritten. Rate-limited.
 */
export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  if ((await prisma.user.count()) > 0) return Response.json({ error: "LEVEL UP is already set up. Restore is only offered on a new, empty installation." }, { status: 403 });
  if (!env.setupToken) return Response.json({ error: "SETUP_TOKEN is not configured on the server." }, { status: 503 });
  const key = await clientKey();
  const attempt = await beginAttempt(key);
  if (attempt.blocked) return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return Response.json({ error: "That file is too large to be a LEVEL UP backup." }, { status: 413 });
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid request." }, { status: 400 });
  if (!safeEqual(String(form.get("token") ?? ""), env.setupToken)) return Response.json({ error: "Setup token is incorrect." }, { status: 403 });
  const passphrase = String(form.get("passphrase") ?? "");
  const file = form.get("file");
  const upload = file instanceof File && file.size > 0 ? Buffer.from(await file.arrayBuffer()) : null;
  try {
    const r = await disasterRestore({ passphrase, upload });
    await finishAttempt(attempt.id, key, true);
    return Response.json({ ok: true, ...r });
  } catch (e) {
    const msg = e instanceof Error && /passphrase|damaged|backup|Backups|owner|Upload/i.test(e.message) ? e.message : "Restore failed. Nothing was changed.";
    return Response.json({ error: msg }, { status: 400 });
  }
}
