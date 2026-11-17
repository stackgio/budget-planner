import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { INTEGRATIONS } from "@/server/integrations";
import { PageHeader } from "@/ui/bits";

export default async function IntegrationsPage() {
  await appContext();
  return (
    <div className="space-y-4">
      <Link href="/settings" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Settings</Link>
      <PageHeader eyebrow="Settings" title="Integrations" />
      <p className="card text-sm text-mute-300">None of these are connected. Each one needs your approval in a future phase and your in-app consent. Imported records always go to a review screen with duplicate detection — nothing is added automatically.</p>
      <ul className="space-y-3">
        {INTEGRATIONS.map((i) => (
          <li key={i.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{i.name}</h2>
              <span className="chip-mute shrink-0">Not connected</span>
            </div>
            <p className="mt-1 text-sm text-mute-300">{i.description}</p>
            <dl className="mt-3 space-y-1 text-xs text-mute-400">
              {i.wouldRead.length > 0 && <div><dt className="inline font-semibold text-mute-300">Would read: </dt><dd className="inline">{i.wouldRead.join("; ")}</dd></div>}
              <div><dt className="inline font-semibold text-mute-300">Would share: </dt><dd className="inline">{i.wouldShare.join("; ")}</dd></div>
              <div><dt className="inline font-semibold text-mute-300">Cost: </dt><dd className="inline">{i.costNote}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
