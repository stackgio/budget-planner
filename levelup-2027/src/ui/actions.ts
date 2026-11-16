import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { UserError } from "@/server/payroll";

export type ActionState = { ok?: boolean; error?: string; message?: string; nonce?: number } | null;

/** Run a server action body, turning expected failures into a friendly message. */
export async function run(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    return { ok: true, message: message || undefined, nonce: Date.now() };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof UserError) return { error: e.message, nonce: Date.now() };
    if (e instanceof ZodError) return { error: e.issues.map((i) => i.message).join(" "), nonce: Date.now() };
    console.error(e);
    return { error: "Something went wrong. Nothing was changed.", nonce: Date.now() };
  }
}
