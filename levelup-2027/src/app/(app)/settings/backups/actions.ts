"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth";
import { backupNow, testRestore } from "@/server/backup-service";
import { UserError } from "@/server/payroll";
import { run, type ActionState } from "@/ui/actions";

const friendly = (e: unknown) => new UserError(e instanceof Error && /passphrase|storage|backup/i.test(e.message) ? e.message : "The backup could not be completed. Nothing was changed. Check Diagnostics or try again later.");

export async function backupNowAction(_p: ActionState, _fd: FormData): Promise<ActionState> {
  await requireUser();
  const r = await run(async () => {
    try {
      const b = await backupNow("MANUAL");
      return `Backup saved and verified (${Math.round((b.bytes ?? 0) / 1024)} KB).`;
    } catch (e) { throw friendly(e); }
  });
  revalidatePath("/settings/backups");
  return r;
}

export async function testRestoreAction(_p: ActionState, _fd: FormData): Promise<ActionState> {
  await requireUser();
  const r = await run(async () => {
    try {
      const t = await testRestore();
      if (!t.ok) throw new UserError(`Restore test found a problem: ${[t.countsMatch === false && "row counts differ", t.ledgerIssues.length && "ledger issues", t.keyStatus !== "OK" && `encryption key ${t.keyStatus.toLowerCase()}`, t.notesReadable === false && "notes unreadable"].filter(Boolean).join(", ")}.`);
      return `Restore test passed: the newest backup restored into a temporary database, the ledger reconciled${t.notesReadable ? ", and private notes decrypted" : ""}. The temporary copy was deleted.`;
    } catch (e) { if (e instanceof UserError) throw e; throw friendly(e); }
  });
  revalidatePath("/settings/backups");
  return r;
}
