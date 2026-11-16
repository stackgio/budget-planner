import { PageHeader } from "@/ui/bits";
export default function AssistantPage() {
  return (
    <div>
      <PageHeader eyebrow="Level Up Assistant" title="Assistant" />
      <section className="card space-y-3 text-sm text-mute-300">
        <p className="chip-mute">Planned · Phase 3</p>
        <p>The rule-based assistant will build your 6:00 AM briefing, 5:00 PM check-in and 9:00 PM reflection from your real calendar, tasks, habits and paydays — and stay quiet during overtime, activation and recovery.</p>
        <p>It is not active yet, and no AI provider is connected. Any optional AI chat will require your explicit consent before private data is sent anywhere.</p>
        <p>Today, the Home screen shows simple rule-based heads-ups from your saved data.</p>
      </section>
    </div>
  );
}
