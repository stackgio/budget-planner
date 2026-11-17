import { timingSafeEqual, createHash } from "node:crypto";
import { runSchedulerExclusive } from "@/server/notifications";

export const dynamic = "force-dynamic";

/**
 * For a future deployed cron job. Disabled unless CRON_SECRET is set; requires the secret in
 * the "x-cron-secret" header. Returns only counts — never notification content.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Not found", { status: 404 });
  const given = req.headers.get("x-cron-secret") ?? "";
  const h = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(h(given), h(secret))) return new Response("Forbidden", { status: 403 });
  const r = await runSchedulerExclusive({ worker: "cron" });
  return Response.json(r);
}
