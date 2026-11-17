import { appContext } from "@/server/context";
import { careerOverview } from "@/server/edu";
import { loadGoals } from "@/server/growth";
import { dateToLocal, formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { careerProfileAction, eduItemAction, jobAction } from "../actions";
import { GoalCard } from "../GoalCard";

const LEVEL: Record<string, string> = { PROMOTION: "DOC promotion", STATE: "State", COUNTY: "County corrections", FEDERAL: "Federal corrections", OTHER: "Other" };
const STATUS: Record<string, string> = { RESEARCHING: "Researching", PREPARING: "Preparing", APPLIED: "Applied", INTERVIEW: "Interview", OFFER: "Offer", CLOSED: "Closed", NOT_PURSUING: "Not pursuing" };
const diff = (c: number | null) => (c === null ? "—" : `${c >= 0 ? "+" : "−"}${formatCents(Math.abs(c))}/yr`);

function JobForm({ j }: { j?: Awaited<ReturnType<typeof careerOverview>>["jobs"][number] }) {
  return (
    <ActionForm action={jobAction} className="space-y-3">
      {j && <input type="hidden" name="id" value={j.id} />}
      <Field label="Position"><input className="input" name="title" defaultValue={j?.title} required maxLength={120} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Agency"><input className="input" name="agency" defaultValue={j?.agency} required maxLength={120} /></Field>
        <Field label="Type"><select className="input" name="level" defaultValue={j?.level ?? "COUNTY"}>{Object.entries(LEVEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Location"><input className="input" name="location" defaultValue={j?.location ?? ""} maxLength={80} /></Field>
        <Field label="Status"><select className="input" name="status" defaultValue={j?.status ?? "RESEARCHING"}>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Pay min"><input className="input" name="payMin" inputMode="decimal" defaultValue={j?.payMinCents ? (j.payMinCents / 100).toFixed(2) : ""} /></Field>
        <Field label="Pay max"><input className="input" name="payMax" inputMode="decimal" defaultValue={j?.payMaxCents ? (j.payMaxCents / 100).toFixed(2) : ""} /></Field>
        <Field label="Per"><select className="input" name="payPeriod" defaultValue={j?.payPeriod ?? "HOURLY"}><option value="HOURLY">Hour</option><option value="ANNUAL">Year</option></select></Field>
      </div>
      <p className="text-xs text-mute-400">Enter pay only from the actual posting. Nothing is looked up or assumed.</p>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Deadline"><input className="input" type="date" name="deadline" defaultValue={j?.deadline ?? ""} /></Field>
        <Field label="Applied on"><input className="input" type="date" name="appliedOn" defaultValue={j?.appliedOn ?? ""} /></Field>
        <Field label="Interview"><input className="input" type="date" name="interviewOn" defaultValue={j?.interviewOn ?? ""} /></Field>
      </div>
      <Field label="Notes (encrypted)"><textarea className="input min-h-[64px] py-2" name="notes" defaultValue={j?.notes ?? ""} maxLength={4000} /></Field>
      <Field label="Interview prep (encrypted)"><textarea className="input min-h-[64px] py-2" name="prepNotes" defaultValue={j?.prepNotes ?? ""} maxLength={4000} placeholder="Stories, questions to ask, documents to bring" /></Field>
      <SubmitButton className="btn-primary w-full">Save</SubmitButton>
    </ActionForm>
  );
}

export default async function CareerPage() {
  const { user, today } = await appContext();
  const c = await careerOverview(user.id);
  const goals = await loadGoals(user.id, today, { category: "CAREER", status: { not: "ARCHIVED" } });
  const active = c.jobs.filter((j) => !["CLOSED", "NOT_PURSUING"].includes(j.status));

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Career" title="Career development">
        <Dialog title="Track an opportunity" trigger="Add opportunity" triggerClassName="btn-primary" wide><JobForm /></Dialog>
      </PageHeader>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Current role</p>
            <p className="mt-1 text-lg font-semibold">{c.profile?.title ?? "—"}</p>
            <p className="text-sm text-mute-400">{c.profile?.employer}{c.profile?.hireDate ? ` · since ${formatLocalDate(dateToLocal(c.profile.hireDate))}` : ""}</p>
          </div>
          <Dialog title="Current role" trigger="Edit" triggerClassName="btn-ghost btn-sm">
            <ActionForm action={careerProfileAction} className="space-y-3">
              <Field label="Employer"><input className="input" name="employer" defaultValue={c.profile?.employer} required /></Field>
              <Field label="Title"><input className="input" name="role" defaultValue={c.profile?.title} required /></Field>
              <Field label="Hire date (optional)"><input className="input" type="date" name="hireDate" defaultValue={c.profile?.hireDate ? dateToLocal(c.profile.hireDate) : ""} /></Field>
              <Field label="Notes (no confidential operational details)"><input className="input" name="notes" defaultValue={c.profile?.notes ?? ""} maxLength={500} /></Field>
              <SubmitButton className="btn-primary w-full">Save</SubmitButton>
            </ActionForm>
          </Dialog>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Regular hourly rate" value={c.hourlyCents !== null ? `${formatCents(c.hourlyCents)}/h` : "—"} sub={`${c.rateProvisional ? "provisional · " : ""}edit on Overtime Payroll`} />
          <Stat label="Annualized (2,080 h)" value={c.hourlyCents !== null ? formatCents(c.hourlyCents * 2080) : "—"} tone="mute" sub="gross, before deductions" />
        </div>
        <p className="text-xs text-mute-400">Plan: finish your second DOC year before pursuing county or federal roles. Keep confidential operational information out of LEVEL UP.</p>
      </section>

      <Section title="Professional development goals" action={<a href="/goals" className="link text-xs">New goal</a>}>
        {goals.length ? <div className="grid gap-3 sm:grid-cols-2">{goals.map((g) => <GoalCard key={g.id} g={g} />)}</div> : <Empty>Add a Career goal, e.g. “Complete year two at DOC”.</Empty>}
      </Section>

      <Section title={`Opportunities · ${active.length} active`}>
        {c.jobs.length ? (
          <ul className="space-y-3">
            {c.jobs.map((j) => (
              <li key={j.id} className="rounded-xl border border-ink-700 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold">{j.title}</p><p className="text-xs text-mute-400">{j.agency} · {LEVEL[j.level]}{j.location ? ` · ${j.location}` : ""}{j.deadline ? ` · deadline ${formatLocalDate(j.deadline, "weekday")}` : ""}</p></div>
                  <span className={["OFFER", "INTERVIEW"].includes(j.status) ? "chip-go" : j.status === "APPLIED" ? "chip-warn" : "chip-mute"}>{STATUS[j.status]}</span>
                </div>
                {j.compare && <p className="mt-2 text-xs text-mute-300">vs. your current pay: <span className="num">{diff(j.compare.minDiffCents)}</span>{j.compare.maxDiffCents !== null ? <> to <span className="num">{diff(j.compare.maxDiffCents)}</span></> : null} <span className="text-mute-400">(posting figures you entered, annualized)</span></p>}
                <Dialog title={j.title} trigger="Open" triggerClassName="btn-ghost btn-sm mt-1" wide><JobForm j={j} /></Dialog>
              </li>
            ))}
          </ul>
        ) : <Empty>No opportunities tracked yet. Promotions, county and federal postings all go here — only ones you add.</Empty>}
      </Section>

      <Section title="Training & certifications" action={
        <Dialog title="Add training or certification" trigger="Add" triggerClassName="btn-secondary btn-sm">
          <ActionForm action={eduItemAction} className="space-y-3">
            <input type="hidden" name="op" value="credential" />
            <Field label="Name"><input className="input" name="name" required maxLength={120} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kind"><select className="input" name="kind"><option value="TRAINING">Training</option><option value="CERTIFICATION">Certification</option></select></Field>
              <Field label="Status"><select className="input" name="status"><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></Field>
            </div>
            <SubmitButton className="btn-primary w-full">Save</SubmitButton>
          </ActionForm>
        </Dialog>
      }>
        {c.credentials.length ? <ul className="divide-line text-sm">{c.credentials.map((x) => <li key={x.id} className="flex justify-between py-2"><span>{x.name} <span className="text-xs text-mute-400">· {x.kind.toLowerCase()}</span></span><span className={x.status === "COMPLETED" ? "chip-go" : "chip-mute"}>{x.status.replace("_", " ").toLowerCase()}</span></li>)}</ul> : <Empty>Add trainings and special-team experience as you complete them.</Empty>}
      </Section>
    </div>
  );
}
