import "server-only";
import { answer, type Answer } from "../assistant";

/**
 * Assistant provider interface. Only the rule-based provider exists and is active.
 * A future AI provider would implement the same interface, but it must:
 *   1. be explicitly approved by you (new phase),
 *   2. ask for in-app consent before any private data leaves your server,
 *   3. send only the minimum context needed, never secrets or encrypted notes,
 *   4. be clearly labelled in the UI, with the rule-based provider as the fallback.
 * Nothing here contacts any external service.
 */
export interface AssistantProvider {
  readonly id: string;
  readonly external: boolean;
  ask(ctx: { ownerId: string; tz: string; today: string; question: string }): Promise<Answer>;
}

export const ruleBasedProvider: AssistantProvider = {
  id: "rules",
  external: false,
  ask: (c) => answer(c.ownerId, c.tz, c.today, c.question),
};

/** Placeholder only. Deliberately unusable until a later, approved phase. */
export const externalAiProvider: AssistantProvider = {
  id: "external-ai (not enabled)",
  external: true,
  async ask() {
    throw new Error("External AI is not enabled. It requires your explicit approval and in-app consent.");
  },
};

/** Always the rule-based provider in this phase, regardless of environment variables. */
export function activeProvider(): AssistantProvider {
  return ruleBasedProvider;
}
