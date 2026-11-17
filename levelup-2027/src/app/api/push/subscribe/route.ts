import { z } from "zod";
import { assertSameOrigin, getCurrentUser } from "@/server/auth";
import { removeSubscription, saveSubscription } from "@/server/notifications";
import { UserError } from "@/server/payroll";

export const dynamic = "force-dynamic";

const body = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
  label: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid subscription." }, { status: 400 });
  try {
    const s = await saveSubscription(user.id, { endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, label: parsed.data.label, userAgent: req.headers.get("user-agent") });
    return Response.json({ ok: true, id: s.id });
  } catch (e) {
    return Response.json({ error: e instanceof UserError ? e.message : "Could not save." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json().catch(() => null) as { endpoint?: string; id?: string } | null;
  const key = data?.endpoint ?? data?.id;
  if (!key) return Response.json({ error: "Missing device." }, { status: 400 });
  return Response.json({ ok: true, removed: await removeSubscription(user.id, key) });
}
