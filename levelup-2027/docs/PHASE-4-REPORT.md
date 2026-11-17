# LEVEL UP 2027 — Phase 4 Report: Assistant, Briefings, Reminders & Notifications

Status: complete locally. Not deployed. No paid services. No real push notifications sent.

## Delivered

**Phase 3 usability**
- Workout templates: create, edit, duplicate, archive or restore, with Home, Gym or Recovery type. Each exercise has sets, reps, weight or resistance, rest time and notes. Exercise library entries are archived, never deleted. Past workout logs are unchanged.
- Education: courses, tuition, milestones and study plans can be edited and archived or restored.
- Encryption-key recovery:
  - The plan is in `docs/ENCRYPTION-KEY-RECOVERY.md`.
  - `npm run key:check` checks the key. It returns one of four results: OK, MISSING, INVALID_FORMAT or MISMATCH.
  - `npm run key:drill` passed using synthetic data and temporary databases.
  - If the key is wrong, the app fails safely and shows a "Private text unavailable" notice. The key is never rotated automatically.

**Assistant**
- Morning briefing at 6 AM, Check-in at 5 PM, and Evening reflection at 9 PM. Each section can be turned on or off.
- Ask: a rule-based assistant that answers from your stored records only. It covers 11 kinds of question and gives a clear "I can help with these" answer otherwise.
- Projected paydays and estimates are labelled as such. Questions are not stored.
- Actions such as completing a task, dismissing a suggestion or saving a reflection only happen when you tap. Reflections are encrypted.
- An optional AI provider interface exists in the code, but it is disabled and nothing is connected to it.

**Notifications**
- Notification center:
  - Shows unread and read items, category, priority, and links to the related page.
  - Supports mark read, mark all read, snooze (1 hour, this evening or tomorrow), dismiss, and a history view.
  - A bell with an unread count sits in the header.
- Settings:
  - 15 reminder types, each toggleable. Includes payday and overtime payday (always labelled projected), extra-paycheck month, Roth, tiles, other transfers, milestones, job deadlines, workouts, date night, important dates, faith, and weekly or monthly reviews.
  - Briefing sections, quiet hours (21:45–05:45 by default), and per-work-mode rules (all reminders, or important only).
  - Lock-screen detail is off by default.
- Scheduler (local worker, `npm run worker`):
  - Schedules and delivery records are stored in PostgreSQL.
  - DST-safe in America/New_York.
  - Idempotent: unique dedupe keys, `SKIP LOCKED` claims and an advisory-lock tick, so concurrent workers don't duplicate work.
  - Retries are bounded. Reminders expire instead of piling up into a catch-up flood.
  - Tracked states: scheduled, delivered, deferred, suppressed, snoozed, dismissed, failed, expired.
- PWA:
  - Manifest with 192, 512 and maskable icons, and a service worker that handles push and notification clicks without caching.
  - Push subscriptions are stored with subscribe and unsubscribe, and the permission screen handles every state.
  - Push stays off until VAPID keys are set.
- Reviews link to the assistant and notifications, and no duplicate review records are created.
- Export version 4 adds notification preferences, notifications, push devices (label and dates only), reflections and dismissals. Secrets and push keys are excluded.

## Migrations (additive only; no financial tables touched)
- `20261119000000_editable_templates_education`: adds template kind and weight notes, plus `archivedAt` on courses, tuition and milestones.
- `20261119000100_phase4_notifications`: adds 8 tables (EncryptionKeyCheck, NotificationPreference, Notification, PushSubscription, PushDelivery, SchedulerRun, DailyReflection, AssistantDismissal) with unique constraints and CHECK constraints.

## Verification

| Check | Result |
|---|---|
| TypeScript | 0 errors |
| Unit tests | 90 passed |
| Integration tests (real PostgreSQL) | 105 passed |
| E2E tests (iPhone 13, production build) | 35 passed |
| Production build | passes |
| `npm audit` | 0 vulnerabilities |
| Schema drift (dev and test) | none |
| `npm run key:check` on dev | OK |
| `npm run key:drill` | passed |
| Files changed outside `levelup-2027/` | none |

Financial invariants are re-verified by the Phase 2 and 3 suites: integer cents, regular and overtime income kept separate, over-commit and delete triggers, idempotency keys, and no fabricated records.

## Known limitations
- Push has not been tested on a real iPhone. It needs HTTPS and installation to the Home Screen (iOS 16.4+), and VAPID keys are not configured locally.
- Push delivery is at-least-once per round. If the worker crashes between sending and recording, one duplicate is possible.
- There are no iOS splash startup images yet.
- The existing "Recovery" template keeps type Home. You can change it in the editor.
- Faith reminder labels are fixed text.
- Snoozing extends a reminder's expiry by up to the snooze length.

## Deployment
See `docs/DEPLOYMENT-PROPOSAL.md`. It is a proposal only, estimated at about $5–8 per month on Railway Hobby, and has not been executed.
