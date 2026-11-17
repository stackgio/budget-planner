import { getCurrentUser } from "@/server/auth";
import { vapidPublicKey } from "@/server/push";

export const dynamic = "force-dynamic";

/** The server's public VAPID key (public by design). Null until push is configured on a deployed server. */
export async function GET() {
  if (!(await getCurrentUser())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ publicKey: vapidPublicKey() });
}
