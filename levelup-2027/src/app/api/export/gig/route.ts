import { getCurrentUser } from "@/server/auth";
import { gigCsv } from "@/server/gig";
import { isLocalDate } from "@/domain/dates";

export const dynamic = "force-dynamic";

/** Tax-preparation CSV of your own gig records (authenticated, owner-scoped, never cached). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const kind = u.searchParams.get("kind");
  const from = u.searchParams.get("from") ?? "";
  const to = u.searchParams.get("to") ?? "";
  if ((kind !== "sessions" && kind !== "mileage" && kind !== "payouts") || !isLocalDate(from) || !isLocalDate(to) || to < from) {
    return Response.json({ error: "Choose sessions, mileage or payouts and a valid date range." }, { status: 400 });
  }
  const csv = await gigCsv(user.id, kind, from, to);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="levelup-gig-${kind}-${from}-to-${to}.csv"`,
      "cache-control": "no-store",
    },
  });
}
