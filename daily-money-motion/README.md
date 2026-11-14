# Daily Money Motion — Stack With Gio

A research-first production system for **15-second (450-frame), 1080×1920, 30 fps** finance videos, published **every 72 hours** (see `SCHEDULE-PROPOSAL.md`; not active yet). It is a separate module: it reuses the existing Remotion project in `video/` and doesn't change any existing video, workflow or schedule.

```
RESEARCH → SELECT A PROVEN FORMAT → ORIGINAL SCRIPT → BUILD → RENDER → QC → PREPARE TO PUBLISH
```

## What already existed (inspected 2026-11-14, left untouched)
| System | Where | Notes |
|---|---|---|
| `/graph` historical-graph engine | `video/src/GraphVideo.tsx`, `video/scripts/{fetch_prices,compute,build_spec}.py`, `.claude/commands/graph.md` | Verified market-data videos |
| `/motion` narrated "Editorial Motion" system | `.claude/skills/motion/`, `video/src/story/`, `video/src/videos/debt-three-things/`, `video/scripts/motion/` | Voice-timed, cream/black looks, Marcus the stickman |
| **Daily Story schedule** | A Claude scheduled task, "Stack With Gio Daily Stories" (06:50 America/New_York), plus a dashboard artifact with its own PNG engine | Lives outside this repo. Not modified. |
| Moneyflow app | `moneyflow/` | Unrelated to video |

## What this module adds
| Path | Purpose |
|---|---|
| `video/src/daily/theme.ts` | Brand tokens: #080D0A / #FFFFFF / #36D979 / #9CA3AF, safe area, type scale, 450-frame duration |
| `video/src/daily/components/` | Reusable: `Stage` + `FilmFinish` (key light, vignette, grain) · `Camera2D` (keyed world camera) · `GlassBack`/`GlassFront` (2.5D glass container with internal light) · `Note` (stylised banknote, not real currency) · `Panel` · `Headline` (masked line rise/swap) · `GrowthChart` (value vs money-put-in) · `SplitBar` (an amount consumed by items) · `YearTrack` · `Signature` · `MusicBed` · `SafeZoneOverlay`. Episodes can also use `@remotion/motion-blur`'s `CameraMotionBlur`. Also reuses the story system's `NumberCounter`, `Sfx` and motion presets. |
| `video/src/daily/episodes/<dmmNNN>/` | One folder per episode: `facts.ts` (every number, with provenance) · `timing.ts` (frame grid + QC beats) · `Episode.tsx` |
| `video/src/daily/DailyRoot.tsx` | Registers `DMM<NNN>` compositions (one line added to `src/Root.tsx`) |
| `video/scripts/daily/render.sh` | Versioned render plus hard checks: 450 frames, 1080×1920, 30 fps, h264, decode, blackdetect, freezedetect, audio peak. Writes beat frames, motion strips, a contact sheet and the cover. Never overwrites. |
| `video/scripts/daily/make_music.py` | Original 120 BPM music bed, synthesized in the repo (rights-clean) |
| `video/scripts/daily/make_dmm002_audio.py` | Per-episode soundtrack generated from the episode's own event schedule (frame-exact SFX + score). Use it as the pattern for synced sound. |
| `daily-money-motion/research/viral-references.json` | Persistent reference library (separate from production) |
| `daily-money-motion/research/research-notes/` | Per-session notes and winner scoring |
| `daily-money-motion/production-log.json` | Production database: statuses, history, hooks, layouts, references used |
| `daily-money-motion/episodes/<ID>/` | Script + storyboard, adaptation notes, caption, metadata, QC report, asset manifest, cover |
| `daily-money-motion/scripts/dmm.mjs` | Pipeline CLI (see below) |
| `.claude/commands/money-motion.md` | `/money-motion` — the daily procedure for Claude |

Final MP4s live in `video/renders/daily/<ID>/<ID>_vNN.mp4` (QC folders are git-ignored).

## Episodes so far
| ID | Style | Pillar | Hook | Status |
|---|---|---|---|---|
| DMM-001 | B · split-screen dashboard | money discipline | YOU GOT A $500 RAISE. WHERE DOES IT GO? | NEEDS_FIXING (8.4) |
| DMM-002 | C · cinematic 2.5D object + camera | saving | $20 A DAY. NOBODY NOTICES. | NEEDS_FIXING (8.5, sound unheard) |

The style follows the winning reference. Don't default to DMM-001's dashboard. Keep its numbers, comparisons and growth graphics as tools, used selectively.

## Pipeline (each production day)
```bash
node daily-money-motion/scripts/dmm.mjs due                         # rolling 72 h gate (exit 3 = not today)
node daily-money-motion/scripts/dmm.mjs next-pillar                 # least-recently-used pillar
node daily-money-motion/scripts/dmm.mjs unused-refs                 # strongest unused references
node daily-money-motion/scripts/dmm.mjs new 2026-11-15 saving-money "topic"   # reserves DMM-002 (one per date, idempotent)
# research → add references → choose winner → script/storyboard → build video/src/daily/episodes/dmm002/
node daily-money-motion/scripts/dmm.mjs set DMM-002 hook "…"; … set DMM-002 layout "…"; … set DMM-002 reference_ids '["REF-0003"]'
node daily-money-motion/scripts/dmm.mjs check DMM-002               # 30-day duplicate check (topic, hook, layout, references)
node daily-money-motion/scripts/dmm.mjs render DMM-002              # → REVIEWING, or NEEDS_FIXING on a failed hard check
# open the beat frames, strips and contact sheet; fix; render again (new version)
node daily-money-motion/scripts/dmm.mjs status DMM-002 POST_READY "QC 9.1, all checks"
```
Statuses: RESEARCHING → REFERENCE_SELECTED → SCRIPT_READY → BUILDING → REVIEWING → NEEDS_FIXING | POST_READY → QUEUED → PUBLISHED (or FAILED). The CLI refuses to queue anything that isn't POST_READY, to queue or publish the same episode twice, or to create a second episode for the same date. Every action is appended to `logs/pipeline.log`. Retry = run `render` again (a new version; earlier versions are kept).

## Quality system
- `video/scripts/daily/qc_episode.py <ID> <mp4> [--stt]` runs automatically after every `render.sh`. It measures export, audio (voice untouched, SFX-to-voice ratio, no music, peaks), speech-to-text intelligibility and sync, caption spelling, frame-0, hook motion, jumps, static holds, safe-zone bands and visual similarity to past episodes → `QC_AUTO.md`.
- `dmm.mjs gate <ID> <score> <qc_auto.json>` is the only way to get **READY FOR MY REVIEW** (≥ 9.0 and 0 FAIL); otherwise **NEEDS FIXING**.
- `CHECKLIST.md` is the living checklist and recurring-problem log; `feedback.json` holds the creator's reviews and real analytics.

## Audio default (from DMM-003 v03)
**Stack voice narration + very subtle SFX + no background music.** The creator adds music on each platform. Measured targets: SFX about 30 dB+ below the voice during speech; digital silence wherever no effect is scheduled; the voice track untouched (gain about 0 dB vs the ElevenLabs file). See `config.json → audio`.

## Rules that never bend
- Research comes first, using real posts with visible evidence. If the research tools are unavailable, use only the verified library or ask the creator for links. Never invent creators, URLs or views.
- Every number lives in `facts.ts`, computed in code. Hypothetical figures carry an on-screen **EXAMPLE** label and their assumptions. Nothing is guaranteed, and nothing is personalised advice.
- Borrow principles, not expression: no reused footage, audio, graphics, text or shot-by-shot sequences. Record what was borrowed and what was changed in `adaptation-notes.md`.
- Audio must be original (synthesized here) or have a documented licence that covers every platform. Trending in-app audio is never assumed to be licensed.
- POST_READY only after every available check has been completed, a creative score of ≥ 9, and the creator's approval of the pilot.

## Scheduling and publishing (needs your approval)
Nothing is scheduled or published yet. The full proposal is in **`SCHEDULE-PROPOSAL.md`**: a new, separate task fires daily at 06:13 ET, and `dmm.mjs due` lets it work only every 72 h. Delivery is by 07:00 ET, the same time of day as the Stories. The existing Daily Stories task is untouched.
2. Publishing stays manual until an integration is tested. Metricool is connected to this account and has scheduled-post tools, but they haven't been tested with video uploads here, so no auto-posting happens. If you want it, the step would be "create a Metricool post **for review**" (a draft you approve), never a direct publish.
3. Note: rendering takes about 2 minutes of container time per episode, and research uses vidIQ credits (about 50–60 per episode at today's usage).

## Weekly learning
Add real post analytics (views, average watch time, completion, shares, saves, follows) to each episode's `published[]` entry in `production-log.json` and to `our_post_performance` in the reference library. Weekly: compare engines, hook patterns and pillars against each other and against the account's own median. Don't invent analytics; leave fields empty until real numbers exist.
