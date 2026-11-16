import "server-only";
import { Prisma, type WorkMode } from "@prisma/client";
import { prisma } from "./db";
import { UserError } from "./payroll";
import { audit } from "./audit";

export async function currentMode(ownerId: string) {
  const open = await prisma.modeSession.findFirst({ where: { ownerId, endedAt: null }, orderBy: { startedAt: "desc" } });
  return open ?? null;
}

/**
 * Switch modes. Ends any open session and opens a new one (NORMAL simply closes).
 * Activation also records a calendar event so the time block is visible and conflicts can be found.
 */
export async function switchMode(
  ownerId: string,
  mode: WorkMode,
  opts: { estimatedEnd?: Date | null; notes?: string | null; now?: Date } = {},
) {
  const now = opts.now ?? new Date();
  try {
    return await prisma.$transaction(async (tx) => {
      const open = await tx.modeSession.findFirst({ where: { ownerId, endedAt: null } });
      if (open) {
        await tx.modeSession.update({ where: { id: open.id }, data: { endedAt: now } });
        if (open.eventId && open.mode === "ACTIVATION") {
          const ev = await tx.calendarEvent.findFirst({ where: { id: open.eventId, ownerId } });
          if (ev && ev.endAt > now) await tx.calendarEvent.update({ where: { id: ev.id }, data: { endAt: now > ev.startAt ? now : ev.endAt } });
        }
      }
      if (mode === "NORMAL") {
        await audit(tx, ownerId, "ModeSession", open?.id ?? "-", "return-to-normal", open, undefined);
        return null;
      }
      if (opts.estimatedEnd && opts.estimatedEnd <= now) throw new UserError("Estimated end must be in the future.");
      let session = await tx.modeSession.create({
        data: { ownerId, mode, startedAt: now, estimatedEnd: opts.estimatedEnd ?? null, notes: opts.notes ?? null },
      });
      if (mode === "ACTIVATION") {
        const end = opts.estimatedEnd ?? new Date(now.getTime() + 12 * 3_600_000);
        const ev = await tx.calendarEvent.create({
          data: {
            ownerId,
            title: "Special-team activation",
            category: "ACTIVATION",
            startAt: now,
            endAt: end,
            important: true,
            description: opts.estimatedEnd ? null : "End time unknown — shown as 12 hours until you end the activation.",
            sourceType: "MODE_SESSION",
            sourceId: session.id,
          },
        });
        session = await tx.modeSession.update({ where: { id: session.id }, data: { eventId: ev.id } });
      }
      await audit(tx, ownerId, "ModeSession", session.id, `start:${mode}`, open, session);
      return session;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new UserError("Another mode change happened at the same time. Refresh and try again.");
    }
    throw e;
  }
}
