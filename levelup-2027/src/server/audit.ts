import "server-only";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function audit(
  tx: Tx,
  ownerId: string,
  entity: string,
  entityId: string,
  action: string,
  before?: unknown,
  after?: unknown,
) {
  const json = (v: unknown) => (v === undefined ? undefined : (JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x))) as Prisma.InputJsonValue));
  await tx.auditLog.create({ data: { ownerId, entity, entityId, action, before: json(before), after: json(after) } });
}
