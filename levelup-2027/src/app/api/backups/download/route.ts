import { getCurrentUser } from "@/server/auth";
import { downloadBackup } from "@/server/backup-service";
import { BACKUP_NAME_RE } from "@/server/backup";

export const dynamic = "force-dynamic";

/** Download an encrypted backup to the iPhone (Save to Files → iCloud Drive). Owner only, never cached. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!BACKUP_NAME_RE.test(key)) return Response.json({ error: "Unknown backup." }, { status: 400 });
  try {
    const data = await downloadBackup(key);
    return new Response(new Uint8Array(data), {
      headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${key}"`, "cache-control": "no-store", "content-length": String(data.length) },
    });
  } catch {
    return Response.json({ error: "Backup not found." }, { status: 404 });
  }
}
