import "server-only";
import type { ImportCandidate } from "@/domain/imports";

/**
 * Optional integrations — PREPARATION ONLY. None is connected, none holds credentials, and none can
 * run in this phase. Each future integration must:
 *   1. be approved by you in a later phase,
 *   2. ask for in-app consent naming exactly what data is read or shared, revocable at any time,
 *   3. be read-only toward LEVEL UP's records: candidates go to a review screen (domain/imports.ts
 *      flags duplicates) and nothing is written without your approval,
 *   4. never send financial records, private notes or secrets to a third party unless that is the
 *      explicit purpose you consented to.
 */
export type IntegrationStatus = "NOT_CONNECTED";

export interface IntegrationProvider {
  readonly id: string;
  readonly name: string;
  readonly direction: "import (read-only)" | "external processing";
  readonly description: string;
  readonly wouldRead: string[];
  readonly wouldShare: string[];
  readonly costNote: string;
  status(): IntegrationStatus;
  preview(): Promise<ImportCandidate[]>;
}

const notEnabled = async (): Promise<never> => { throw new Error("This integration is not enabled. It requires your explicit approval and in-app consent."); };

export const INTEGRATIONS: IntegrationProvider[] = [
  {
    id: "google-calendar", name: "Google Calendar (read-only import)", direction: "import (read-only)",
    description: "Show events from a Google calendar you choose, for conflict checks and briefings.",
    wouldRead: ["Event titles, times and locations from calendars you pick"], wouldShare: ["Nothing — LEVEL UP data is not sent to Google"],
    costNote: "Free (Google Calendar API quota).", status: () => "NOT_CONNECTED", preview: notEnabled,
  },
  {
    id: "external-ai", name: "AI assistant provider", direction: "external processing",
    description: "Optional smarter answers. The built-in rule-based assistant stays the default and the fallback.",
    wouldRead: [], wouldShare: ["Only the question and the minimum context you approve per request", "Never passwords, keys, or encrypted notes"],
    costNote: "Paid API usage — not activated.", status: () => "NOT_CONNECTED", preview: notEnabled,
  },
  {
    id: "gig-platform-import", name: "Gig platform statement import", direction: "import (read-only)",
    description: "Import earnings statements (e.g. a CSV you download from DoorDash, Veho, Instacart or Shipt) for review.",
    wouldRead: ["A file you upload"], wouldShare: ["Nothing"],
    costNote: "Free (file-based; no platform login).", status: () => "NOT_CONNECTED", preview: notEnabled,
  },
  {
    id: "analytics-sources", name: "Additional analytics sources", direction: "import (read-only)",
    description: "e.g. step counts or sleep from a health export, shown in Analytics.",
    wouldRead: ["A file you export from the source app"], wouldShare: ["Nothing"],
    costNote: "Free (file-based).", status: () => "NOT_CONNECTED", preview: notEnabled,
  },
];
