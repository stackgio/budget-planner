import { PageHeader } from "@/ui/bits";
export default function ReviewsPage() {
  return (
    <div>
      <PageHeader eyebrow="Reviews" title="Weekly & monthly reviews" />
      <section className="card space-y-3 text-sm text-mute-300">
        <p className="chip-mute">Planned · Phase 3</p>
        <p>Weekly and monthly reviews will summarize DOC and overtime hours, confirmed income, habits, workouts and upcoming deadlines — using saved data only.</p>
        <p>Meanwhile, Overtime Payroll shows hours and earnings by week, month and year.</p>
      </section>
    </div>
  );
}
