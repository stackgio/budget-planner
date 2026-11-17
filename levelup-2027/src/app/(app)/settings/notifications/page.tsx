import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { getPrefs, notificationDiagnostics } from "@/server/notifications";
import { ALL_CATEGORIES, BRIEFING_SECTIONS, CATEGORY_META } from "@/domain/notify";
import { PageHeader, Section } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { prefsAction } from "../../assistant/actions";
import { routineAction } from "../actions";
import { PushControls } from "./PushControls";
import { DeviceDiagnostics } from "./DeviceDiagnostics";
import { realTestPushAction, testNotificationAction } from "../../assistant/actions";
import { ConfirmAction } from "@/ui/ConfirmAction";

const SECTION_LABEL: Record<string, string> = { shift: "DOC shift", mode: "Work mode", priorities: "Top 3 priorities", calendar: "Calendar", workouts: "Workouts", tasks: "Tasks due", paydays: "Paydays", transfers: "Transfers to confirm", goals: "Goals & deadlines" };

export default async function NotificationSettings() {
  const { user } = await appContext();
  const prefs = await getPrefs(user.id);
  const [settings, devices] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.pushSubscription.findMany({ where: { ownerId: user.id, revokedAt: null }, orderBy: { createdAt: "asc" } }),
  ]);
  const groups = ["Daily", "Financial", "Personal"] as const;
  const diag = await notificationDiagnostics(user.id);
  const ago = (d: Date | null) => (d ? d.toLocaleString("en-US", { timeZone: user.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never");

  return (
    <div className="space-y-4">
      <Link href="/settings" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Settings</Link>
      <PageHeader eyebrow="Settings" title="Notifications" />

      <Section title="Daily times (New York time)">
        <ActionForm action={routineAction} className="grid grid-cols-3 gap-2">
          <input type="hidden" name="wakeTime" value={settings?.wakeTime ?? "06:00"} /><input type="hidden" name="bedTime" value={settings?.bedTime ?? "21:30"} />
          <Field label="Morning briefing"><input className="input" type="time" name="briefingTime" defaultValue={prefs.briefingTime} required /></Field>
          <Field label="Check-in"><input className="input" type="time" name="checkInTime" defaultValue={prefs.checkInTime} required /></Field>
          <Field label="Evening reflection"><input className="input" type="time" name="reflectionTime" defaultValue={prefs.reflectionTime} required /></Field>
          <div className="col-span-3"><SubmitButton className="btn-secondary btn-sm">Save times</SubmitButton></div>
        </ActionForm>
      </Section>

      <ActionForm action={prefsAction} className="space-y-4">
        <Section title="Quiet hours">
          <div className="grid grid-cols-2 gap-2">
            <Field label="From"><input className="input" type="time" name="quietStart" defaultValue={prefs.quietStart} required /></Field>
            <Field label="Until"><input className="input" type="time" name="quietEnd" defaultValue={prefs.quietEnd} required /></Field>
          </div>
          <p className="mt-2 text-xs text-mute-400">Reminders that come due during quiet hours wait until they end — or are skipped if they&apos;d be stale by then.</p>
        </Section>

        <Section title="During heavy work modes">
          <p className="mb-3 text-xs text-mute-400">Paused reminders are dropped, not saved up — nothing piles up for after your shift. Important ones (date night today, a deadline today, money waiting over a week) still come through. Nothing on your calendar or task list is changed.</p>
          {(["OVERTIME", "ACTIVATION", "RECOVERY"] as const).map((m) => (
            <Field key={m} label={`${m[0]}${m.slice(1).toLowerCase()} mode`} className="mb-2">
              <select className="input" name={`mode_${m}`} defaultValue={prefs.modeRules[m] ?? "IMPORTANT_ONLY"}><option value="IMPORTANT_ONLY">Only important reminders</option><option value="ALL">All reminders</option></select>
            </Field>
          ))}
        </Section>

        <Section title="Reminder types">
          {groups.map((g) => (
            <fieldset key={g} className="mb-3">
              <legend className="label">{g}</legend>
              <div className="grid gap-1 sm:grid-cols-2">
                {ALL_CATEGORIES.filter((c) => CATEGORY_META[c].group === g).map((c) => (
                  <label key={c} className="flex min-h-[40px] items-center gap-3 text-sm"><input type="checkbox" name="category" value={c} defaultChecked={prefs.categories[c] !== false} className="h-5 w-5 accent-[#2bea7a]" /> {CATEGORY_META[c].label}</label>
                ))}
              </div>
            </fieldset>
          ))}
          <p className="text-xs text-mute-400">Paydays are always labelled as projected until you record the actual deposit.</p>
        </Section>

        <Section title="Morning briefing sections">
          <div className="grid grid-cols-2 gap-1">
            {BRIEFING_SECTIONS.map((s) => <label key={s} className="flex min-h-[40px] items-center gap-3 text-sm"><input type="checkbox" name="section" value={s} defaultChecked={prefs.briefingSections.includes(s)} className="h-5 w-5 accent-[#2bea7a]" /> {SECTION_LABEL[s]}</label>)}
          </div>
        </Section>

        <Section title="Privacy">
          <label className="flex min-h-[44px] items-start gap-3 text-sm"><input type="checkbox" name="previewDetail" defaultChecked={prefs.previewDetail} className="mt-0.5 h-5 w-5 accent-[#2bea7a]" /><span>Show details on the lock screen<span className="block text-xs text-mute-400">Off (recommended): push banners say things like “You have approved transfers to confirm” — no amounts, names or notes. Details always show inside the app.</span></span></label>
        </Section>
        <SubmitButton className="btn-primary w-full">Save notification settings</SubmitButton>
      </ActionForm>

      <Section title="Push on this device">
        <PushControls />
        {devices.length > 0 && <ul className="mt-3 space-y-1 text-xs text-mute-400">{devices.map((d) => <li key={d.id}>{d.label ?? "Device"} · added {d.createdAt.toISOString().slice(0, 10)}{d.lastSuccessAt ? ` · last delivered ${d.lastSuccessAt.toISOString().slice(0, 10)}` : ""}</li>)}</ul>}
        <details className="mt-3 text-xs text-mute-400">
          <summary className="cursor-pointer text-mute-300">iPhone requirements</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>iOS / iPadOS 16.4 or later.</li>
            <li>LEVEL UP must be served over HTTPS from a real domain (not a local address).</li>
            <li>Add it to your Home Screen from Safari (Share → Add to Home Screen) and open it from that icon.</li>
            <li>Tap “Enable on this device” there; iOS then asks for permission.</li>
            <li>Not yet tested on a real iPhone — that happens only after an approved deployment.</li>
          </ul>
        </details>
      </Section>

      <Section title="Test">
        <p className="mb-3 text-xs text-mute-400">Puts a test notification in your notification center and shows how many devices would get a push. It&apos;s simulated: no push is ever sent from this button.</p>
        <ActionForm action={testNotificationAction}><SubmitButton className="btn-secondary btn-sm" pendingText="Sending…">Send a simulated test</SubmitButton></ActionForm>
        {diag.pushConfigured && diag.devices.active > 0 && (
          <div className="mt-3">
            <ConfirmAction label="Send one real test push" triggerClassName="btn-primary btn-sm" danger={false} title="Send a real test push?" action={realTestPushAction} fields={{}} confirmLabel="Send it">
              This sends one real notification through Apple&apos;s push service to your {diag.devices.active} device{diag.devices.active === 1 ? "" : "s"} with push on. The lock-screen text is generic: “Test notification — push is working.”
            </ConfirmAction>
          </div>
        )}
      </Section>

      <section className="card" aria-labelledby="diag-h">
        <h2 id="diag-h" className="eyebrow mb-3">Diagnostics</h2>
        <dl className="divide-line text-sm">
          <div className="flex justify-between gap-3 py-2"><dt className="text-mute-300">Push keys (VAPID)</dt><dd className={diag.pushConfigured ? "text-go" : "text-mute-400"}>{diag.pushConfigured ? "Configured" : "Not configured"}</dd></div>
          <div className="flex justify-between gap-3 py-2"><dt className="text-mute-300">Reminder worker last ran</dt><dd className={diag.worker.healthy ? "text-go" : "text-warn"}>{ago(diag.worker.lastRunAt)}{diag.worker.minutesSinceRun !== null && !diag.worker.healthy ? " · not running now" : ""}</dd></div>
          <div className="flex justify-between gap-3 py-2"><dt className="text-mute-300">Devices</dt><dd className="text-mute-300">{diag.devices.active} active{diag.devices.failing ? ` · ${diag.devices.failing} failing` : ""}{diag.devices.revoked ? ` · ${diag.devices.revoked} removed` : ""}</dd></div>
          <div className="flex justify-between gap-3 py-2"><dt className="text-mute-300">Last 7 days</dt><dd className="text-right text-mute-300">{Object.keys(diag.last7Days).length ? Object.entries(diag.last7Days).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(" · ") : "No notifications"}</dd></div>
          <div className="flex justify-between gap-3 py-2"><dt className="text-mute-300">Push failures (7 days)</dt><dd className={diag.pushFailures7d ? "text-warn" : "text-mute-300"}>{diag.pushFailures7d}{diag.unknownOutcomeSends ? ` · ${diag.unknownOutcomeSends} unconfirmed` : ""}</dd></div>
        </dl>
        <h3 className="eyebrow mb-1 mt-5">This device</h3>
        <DeviceDiagnostics />
        <details className="mt-4 text-xs text-mute-400">
          <summary className="cursor-pointer text-mute-300">Troubleshooting</summary>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-mute-300">Worker not running:</strong> reminders are created by <code>npm run worker</code> (locally) or the deployed worker. In-app items appear once it runs.</li>
            <li><strong className="text-mute-300">Permission “denied”:</strong> iPhone Settings → Notifications → LEVEL UP → Allow. On desktop, use the site settings in the address bar.</li>
            <li><strong className="text-mute-300">No subscription on iPhone:</strong> open LEVEL UP from the Home Screen icon (not Safari), then tap “Enable on this device”.</li>
            <li><strong className="text-mute-300">Device shows failing:</strong> turn push off and on again on that device. Devices the push service reports as gone are removed automatically.</li>
            <li><strong className="text-mute-300">Got the same alert twice:</strong> rare — if the worker stops mid-send it retries. Alerts share a tag, so iOS normally replaces the first copy instead of showing two.</li>
            <li><strong className="text-mute-300">Nothing during quiet hours or a heavy work mode:</strong> that&apos;s by design; check the settings above.</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
