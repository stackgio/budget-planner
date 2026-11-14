# Proposed schedule change — Daily Money Motion every 72 hours (NOT ACTIVE)

Status: **proposal only.** Nothing has been created, modified or enabled. It needs your approval of the pilot first.

## What exists today (inspected 2026-11-14)
| Scheduled task | When | What it does | Change? |
|---|---|---|---|
| **Stack With Gio Daily Stories** (`trig_01WM5DbZfWVVpMGJYqiXPja7`) | Daily 06:50 America/New_York (cron `50 6 * * *`) | Makes 2 Story PNGs with the dashboard artifact's engine and sends them to your phone by about 07:00. Last run succeeded on 2026-11-13. | **None.** It stays exactly as it is. |
| Daily Money Motion | — | No schedule exists. Both pilots were made by hand in this session. | Add a new, separate task (below) |

No automatic publishing exists in either workflow. Stories are delivered to your phone and you post them yourself. Metricool is connected to the account, but neither workflow uses it.

## Proposed: one NEW scheduled task, separate from Stories
- **Name:** "Stack With Gio — Money Motion (every 72 h)"
- **Fires:** daily at **06:13 America/New_York** (cron `CRON_TZ=America/New_York 13 6 * * *`), in a fresh cloud session on this repository.
- **First step every run:** `node daily-money-motion/scripts/dmm.mjs due`. If it's not a production day, the run stops immediately (no research, no credits, no message).
  - Why a daily cron plus a gate rather than `*/3`: day-of-month steps reset at month ends (31 → 1 is only a one-day gap). The gate counts days from an anchor date, so the interval is a true rolling 72 hours, every time.
  - The gate also refuses a second episode for the same date, and refuses anything less than 3 days after the last episode, so posts are never duplicated.
- **On a production day:** it runs `/money-motion` (research → select → build → render → QC → package), commits to a dated branch, and sends the MP4, cover, caption and QC report to your phone **by about 07:00 ET**. That matches your existing Story delivery time, so you post Money Motion at the same time of day you already post. It finishes 30+ minutes before the Stories run starts.
- **Stops at POST_READY or NEEDS_FIXING.** It never publishes or queues anything. You post manually, or, if you want later, it could create a **Metricool draft for review** (an approve-first post). That would need one supervised test upload before it's enabled.
- **Anchor date:** the first production day after you approve, e.g. 2026-11-17 → 11-20 → 11-23 → 11-26 → 11-29 → 12-02 …

## What changes in the repo when you approve
1. In `daily-money-motion/config.json`, set `schedule.active: true` and `schedule.anchorDate: "<first date>"`.
2. Create the scheduled task above with a standalone prompt.
3. Nothing else. The Stories task, its dashboard artifact and its engine are not touched.

## Costs to know
- About 50–60 vidIQ credits per episode (research and 3–5 video analyses) on production days only. Non-production days cost nothing.
- About 3–5 minutes of render time per episode.
