import Link from "next/link";
import { PageHeader } from "@/ui/bits";
export default function GoalsPage() {
  return (
    <div>
      <PageHeader eyebrow="Goals" title="Goals" />
      <section className="card space-y-3 text-sm text-mute-300">
        <p className="chip-mute">Planned · Phase 5</p>
        <p>Annual, quarterly, monthly and weekly goals across fitness, faith, relationship, Valencia College, career, communication and Stack With Gio will live here, alongside financial goals that read your confirmed challenge records.</p>
        <p>For now, track goal steps as <Link className="link" href="/tasks">tasks</Link> and <Link className="link" href="/tasks?tab=habits">habits</Link>, and see your configured <Link className="link" href="/money/challenges">financial challenges</Link>.</p>
      </section>
    </div>
  );
}
