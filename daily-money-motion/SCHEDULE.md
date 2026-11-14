# Daily Money Motion — schedule (ACTIVE; switched to the worker on 2026-11-14)

| | |
|---|---|
| **Active routine** | `trig_01UHp7TtqVUD6yCo532R1V2z` "Stack With Gio — Daily Money Motion (every 72 h) · worker": **enabled** (scheduler-confirmed) |
| Runs in | the dedicated worker session `session_017Gfiebc5WY4ien94H1aNhz` (stackgio/budget-planner attached; pushes verified) |
| Fires | daily 04:47 America/New_York; `dmm.mjs due` lets only every 3rd day from **2026-11-17** do any work |
| Production days | Tue 2026-11-17 · Fri 11-20 · Mon 11-23 · Thu 11-26 · then 11-29, 12-02 … |
| Delivery | by 07:00 ET (hard stop 06:45): MP4 + cover + QC report + caption via SendUserFile, then a PushNotification; branch `dmm/<date>` |
| History | `scripts/sync_history.sh start` merges the latest `dmm/<date>` branch before each run; `finish` carries the new episode into `claude/daily-money-motion-4tu50i`. Episode IDs come from the merged log; renders are versioned and never overwritten. |
| Publishing | OFF |
| Old routine | `trig_019vHAJJ9CFC3kkFqThZeNEB`: **disabled, not deleted** (its sessions couldn't push). Re-enable it to roll back. |
| Daily Stories | `trig_01WM5DbZfWVVpMGJYqiXPja7`: untouched |

**Operating note:** pressing "Run now" on a routine starts a **fresh, repo-less** session, not the worker, so it can't push. Timed firings go into the worker (verified 2026-11-14 19:15 UTC). For an on-demand episode, ask Claude for a one-shot timed run into the worker, or message the worker session directly ("RUN NOW date=YYYY-MM-DD").

## Verified dry run — 2026-11-14 19:15 UTC (timed firing into the worker)
| Check | Result | Evidence |
|---|---|---|
| Correct project branch + history sync | OK | `sync_history.sh start` → base `653d29b` (latest) |
| Build + typecheck | OK | npm install, `tsc --noEmit` exit 0 |
| Gate | OK | `due 2026-11-17` → due |
| Stack voice | OK | cache hit `4f523e46c7ab92be47ec`, no API credits used |
| Render | OK | `render.sh` hard checks PASS; MP4 1080×1920, 30 fps, 450 frames (re-verified from GitHub) |
| Automated QC | OK | `qc_episode.py`: **0 FAIL · 0 WARN** (STT check skipped by design in dry runs) |
| GitHub push | **OK** | `dmm/dry-run-2026-11-14` → `0d9597c`, later `222e5ec` (confirmed with `git ls-remote` from another session) |
| Delivery + notification | OK | worker transcript: SendUserFile (MP4, cover, QC_AUTO.md, proactive) + PushNotification sent |
| Tools in the worker | vidIQ, Firecrawl, WebSearch, SendUserFile, PushNotification | worker report |

---

## Original proposal (kept for reference)

**Status: proposal only.** No scheduled task has been created and nothing publishes. It needs your explicit approval (see the end).

## What exists today (re-inspected 2026-11-14)
| Scheduled task | When | Changes? |
|---|---|---|
| "Stack With Gio Daily Stories" (`trig_01WM5DbZfWVVpMGJYqiXPja7`) | daily 06:50 America/New_York; Story PNGs on your phone by about 07:00 | **None.** Not touched. |
| Daily Money Motion | none | add ONE new, separate task (below) |

## How it would run
| Item | Proposal |
|---|---|
| Cadence | A rolling **72 hours** from an anchor date you choose: e.g. 11-17 → 11-20 → 11-23 → 11-26 → 11-29 → 12-02 (crosses month ends correctly; not "3 per week") |
| Trigger | One scheduled task, daily at **04:47 America/New_York**, that starts a fresh cloud session on this repo. Its first step is `dmm.mjs due`; on non-production days it stops immediately (no credits, no messages). |
| Work | Runs `/money-motion --scheduled`: research → concept → Stack voice narration (cached) → build → render → automated QC → self-correction (at most 4 render rounds) → honest gate |
| Delivery time | **By 07:00 ET**, your existing preferred delivery time (same as the Stories). Hard stop 06:45 ET. |
| How you receive it | (1) the MP4 (full resolution) and cover sent to the Claude app on your phone, with a push notification; (2) one short message: READY FOR MY REVIEW / NEEDS FIXING, score, concept, confirmations and concerns; (3) all files committed to a branch in `stackgio/budget-planner` |
| Publishing | **Never.** You review, then post manually and add your platform music. |

## Failure and deadline handling
| Situation | What happens |
|---|---|
| The episode reaches ≥ 9 with 0 automated FAIL | "READY FOR MY REVIEW" + package |
| Below 9, or WARNs not resolved by the hard stop | "NEEDS FIXING" + the best MP4 labelled as a review preview + exactly what's wrong and what was tried |
| A render or tool failure leaves no MP4 | A status message with the error and the steps tried; the episode is marked FAILED; the next production day still runs normally (the 72 h anchor doesn't move) |
| vidIQ out of credits | Research falls back to Firecrawl and the verified library; the report says which sources were used |
| ElevenLabs unavailable | No video with a substitute voice. The run stops with a status message (the voice is required). |
| Duplicate risk (`dmm.mjs check`) | Must be fixed before building. Never two episodes for one date, and never closer than 72 h. |

## What you need to approve to activate it
1. **"Activate the 72-hour schedule"**, with the first production date (anchor), e.g. 2026-11-17.
2. **Delivery time.** Keep 07:00 ET (proposed), or name another.
3. **Creative bar acknowledgement.** Right now the pilots score 8.1–8.5, so early scheduled episodes may arrive as NEEDS FIXING previews. You can start anyway (and feed back) or ask for one more pilot first.
4. **Accounts:**
   - **ElevenLabs:** confirm your plan allows commercial use.
   - **vidIQ (optional):** top up credits, or accept Firecrawl-only research.
5. **Branch policy for scheduled commits:** a new `dmm/<date>` branch per episode (proposed), or one long-lived branch.

On approval: set `config.schedule.active=true` and `anchorDate`, then create the scheduled task with the prompt below (push notification on). Nothing else changes.

## Exact prompt the scheduled task would run (fresh session each time)
> You are producing Stack With Gio's Daily Money Motion episode. Gio set this schedule up and is not watching: don't ask questions; decide, finish and report honestly. Repo: stackgio/budget-planner. 1) `cd` to the repo; `cd video && npm install` if needed. 2) Run `node daily-money-motion/scripts/dmm.mjs due`; if it exits non-zero, stop with no message. 3) Otherwise run the `/money-motion` command with today's date (America/New_York) and `--scheduled`, following `.claude/commands/money-motion.md` exactly, including the hard stop at 06:45 ET. 4) Never publish or queue posts. Never claim to have watched references or listened to audio. Never label anything READY FOR MY REVIEW unless `dmm.mjs gate` returned it. 5) Commit and push to a new branch `dmm/<date>`, then deliver the MP4 + cover with SendUserFile (proactive) and one short status message.

## Dry run — 2026-11-14 17:35 UTC (session cse_017GfiedjssRo8sdvbjV484u, fired manually)
| Check | Result |
|---|---|
| Unattended start in a fresh session; gate on a non-production day | OK: "not due on 2026-11-14 (next: 2026-11-17)"; stopped silently |
| Repo clone + base branch | OK (plain `git clone`; `add_repo` isn't available in routine sessions) |
| npm install + typecheck | OK |
| Gate for 2026-11-17 | OK: "due" |
| ElevenLabs (Stack voice) | OK: cache hit; live voice lookup HTTP 200 |
| Render | OK: still rendered |
| File delivery + push notification | OK: cover sent via SendUserFile, notification sent |
| **git push of `dmm/<date>`** | **FAILED (403): the routine's sessions have no repository in their sources.** Delivery doesn't depend on it; the prompt now delivers first and, on 403, also sends production-log.json and says "NOT SAVED TO GITHUB". |
| Research connectors | **None in routine sessions** (no vidIQ, no Firecrawl). They fall back to WebSearch/WebFetch plus the verified library. |

**To fix both (one-time, in the claude.ai app):** open the routine "Stack With Gio — Daily Money Motion (every 72 h)" → edit → add repository `stackgio/budget-planner` (and, optionally, the vidIQ and Firecrawl connectors) → save. Then ask Claude for another dry run.

## GitHub access investigation — 2026-11-14 18:2x–18:4x UTC
- Dry run 2 (routine session `cse_017GfiedaY3hHPkcBna4cAmT`): push to `dmm/dry-run-2026-11-14` was **refused (403)** again. Routine sessions have no `add_repo` tool and no repository source, and the scheduler tools can't add one.
- Worker test (session `session_017Gfiebc5WY4ien94H1aNhz`, created with stackgio/budget-planner attached): **push verified**. `dmm/worker-test-2026-11-14` → `87077f732c35600dee7d4facf57e99bf24655399` (confirmed independently with `git ls-remote`). That session also has vidIQ, Firecrawl, WebSearch, SendUserFile and PushNotification.
- Switching the schedule to fire into that worker session needs the creator's approval (it replaces the routine object). The live routine `trig_019vHAJJ9CFC3kkFqThZeNEB` is unchanged: enabled, delivering files first, GitHub save failing.
