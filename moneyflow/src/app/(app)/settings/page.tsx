import { ShieldCheck, ShieldAlert } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { authEnabled } from "@/lib/session";
import { centsToDecimalString } from "@/lib/money";
import { resetWorkspaceAction, saveSettings, switchWorkspace } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { ConfirmButton, SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, LinkButton, MoneyInput, Notice, PageHeader, Select } from "@/components/ui";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ws = await loadWorkspace();
  const s = ws.settings;
  const audits = await prisma.auditEvent.findMany({ where: { userId: ws.userId }, orderBy: { at: "desc" }, take: 30 });
  const secured = authEnabled();
  const isProd = process.env.NODE_ENV === "production";
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Workspace" subtitle="Demo and Personal are fully separate datasets." />
          <CardBody className="space-y-3">
            <form action={switchWorkspace} className="flex gap-2">
              <Button name="mode" value="personal" variant={ws.user.mode === "personal" ? "primary" : "outline"}>Personal</Button>
              <Button name="mode" value="demo" variant={ws.user.mode === "demo" ? "primary" : "outline"}>Demo (fictional)</Button>
            </form>
            <p className="text-sm text-muted">Personal mode starts with only your stated profile — no invented transactions or balances. Demo mode is a fictional person for exploring features.</p>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <ActionForm action={resetWorkspaceAction}><input type="hidden" name="mode" value="demo" /><ConfirmButton variant="outline" size="sm" message="Regenerate the demo workspace?">Reset demo data</ConfirmButton></ActionForm>
              <LinkButton href="/welcome" variant="outline" size="sm">Review first-run amounts</LinkButton>
            </div>
            <ActionForm action={resetWorkspaceAction} className="flex flex-wrap items-end gap-2 rounded-xl border border-danger/30 p-3">
              <input type="hidden" name="mode" value="personal" />
              <Field label='Erase personal data — type RESET' className="flex-1"><Input name="confirm" autoComplete="off" /></Field>
              <SubmitButton variant="danger" size="md">Reset personal</SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Preferences" />
          <CardBody>
            <ActionForm action={saveSettings} className="space-y-3">
              <Field label="Primary spending account" hint="Used for cash forecasts and 'money until next paycheck'."><Select name="primaryAccountId" defaultValue={s.primaryAccountId ?? ""}><option value="">—</option>{ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
              <Field label="Emergency fund target" hint="Your own number. Used for the 'insufficient emergency savings' warning."><MoneyInput name="emergencyTarget" defaultValue={s.emergencyTargetCents != null ? centsToDecimalString(s.emergencyTargetCents) : ""} /></Field>
              <Field label="Monthly investing contribution goal"><MoneyInput name="investingGoal" defaultValue={s.investingGoalMonthly != null ? centsToDecimalString(s.investingGoalMonthly) : ""} /></Field>
              <SubmitButton>Save preferences</SubmitButton>
            </ActionForm>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm"><span>Appearance</span><ThemeToggle className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm" /></div>
            <p className="mt-3 text-sm"><LinkButton href="/paycheck#anchor" variant="ghost" size="sm" className="px-0 text-brand">Edit pay schedule →</LinkButton></p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Security" action={secured ? <Badge tone="brand"><ShieldCheck className="h-3 w-3" />Passcode on</Badge> : <Badge tone="warn"><ShieldAlert className="h-3 w-3" />Local mode</Badge>} />
          <CardBody className="space-y-3 text-sm">
            {secured ? (
              <p>A passcode and signed, HTTP-only session cookie protect every page and the CSV export.</p>
            ) : (
              <Notice tone="warn" title="Local development mode — not safe to host">No login is required. That's fine on your own computer (localhost) but you must set <code>MONEYFLOW_PASSCODE</code> and <code>MONEYFLOW_SESSION_SECRET</code> before exposing MoneyFlow to any network. For multiple people, replace the passcode with a real auth provider — see README.</Notice>
            )}
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>MoneyFlow never asks for or stores bank usernames or passwords.</li>
              <li>All data is scoped to a workspace id on the server; every action re-checks ownership.</li>
              <li>Inputs are validated server-side; money is stored as integer cents.</li>
              <li>Running {isProd ? "a production build" : "in development"}{isProd && !secured ? " without a passcode — set one now" : ""}.</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Bank sync" />
          <CardBody className="space-y-2 text-sm">
            <Badge>Not connected</Badge>
            <p className="text-muted">MoneyFlow doesn't simulate bank syncing. Use manual entry or CSV import today. A future integration would use a regulated data aggregator (e.g. Plaid, MX, or Finicity) with OAuth — you'd log in at your bank, and MoneyFlow would only receive read-only tokens, never your password.</p>
            <LinkButton href="/transactions/import" size="sm" variant="outline">Import a CSV</LinkButton>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Change log" subtitle="Allocation, pay schedule, bill amount, and confirmation changes — nothing changes silently." />
          <CardBody className="pt-2">
            {audits.length === 0 ? <p className="text-sm text-muted">No changes yet.</p> : (
              <ul className="divide-y divide-border text-sm">{audits.map((a) => <li key={a.id} className="flex gap-3 py-2"><span className="w-24 shrink-0 text-muted">{a.at.toISOString().slice(0, 10)}</span><span>{a.message}</span></li>)}</ul>
            )}
            <a href="/api/export" className="mt-3 inline-block text-sm font-medium text-brand">Export all transactions (CSV)</a>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
