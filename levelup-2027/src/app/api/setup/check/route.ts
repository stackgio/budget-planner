import { prisma } from "@/server/db";
import { assertSameOrigin, beginAttempt, clientKey, finishAttempt, safeEqual } from "@/server/auth";
import { env } from "@/server/env";
import { launchCheck } from "@/server/launch-check";

export const dynamic = "force-dynamic";

/** Launch check: only before the owner account exists, only with the setup token. Reports pass/fail, never secrets. */
export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  if ((await prisma.user.count()) > 0) return Response.json({ error: "LEVEL UP is already set up. Use Settings → Backups and Notifications → Diagnostics instead." }, { status: 403 });
  if (!env.setupToken) return Response.json({ error: "SETUP_TOKEN is not configured on the server yet." }, { status: 503 });
  const key = await clientKey();
  const attempt = await beginAttempt(key);
  if (attempt.blocked) return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (!safeEqual(String(body?.token ?? ""), env.setupToken)) return Response.json({ error: "Setup token is incorrect." }, { status: 403 });
  await finishAttempt(attempt.id, key, true);
  const r = await launchCheck({ requestHost: req.headers.get("x-forwarded-host") ?? req.headers.get("host"), forwardedProto: req.headers.get("x-forwarded-proto"), clientIp: key }, { runBackup: body?.runBackup === true });
  return Response.json(r);
}
