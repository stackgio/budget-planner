---
description: Stack With Gio Daily Money Motion — produce ONE original, narrated, QC-gated 15 s episode (every 72 h when scheduled). Never publishes.
argument-hint: "[date YYYY-MM-DD] [optional pillar or topic] [--scheduled]"
---
# /money-motion — one episode, end to end

Read first, every run:
- `daily-money-motion/README.md`: architecture
- `daily-money-motion/CHECKLIST.md`: the production checklist and recurring problems; follow it line by line
- `daily-money-motion/config.json`: narrator, audio, qc_thresholds, gate, schedule
- `daily-money-motion/feedback.json`: the creator's notes and analytics; apply every lesson

Work from the repo root. Never publish or queue anything. The creator approves every episode.

## 0 · Gate the day (scheduled runs)
- Run `node daily-money-motion/scripts/dmm.mjs due`. If the exit code is non-zero, stop silently: it isn't a production day.
- Note the **hard stop**: `config.schedule.deliverBy` minus `production_limits.hard_stop_minutes_before_delivery` (America/New_York). At the hard stop, go straight to step 8 with whatever exists.

## 1 · Reserve
- **History first:** run `bash daily-money-motion/scripts/sync_history.sh start` (it merges the latest `dmm/<date>` episode branch so `production-log.json`, research and episodes are current) **before** `dmm.mjs new`. Exit code 2 = merge conflict: continue, and report it.
- `dmm.mjs new <DATE> <pillar> "<topic>"`. Take the pillar from `dmm.mjs next-pillar` unless one was given.
- If DATE already has an episode, continue it rather than making a new one.

## 2 · Research (real, labelled, not dependent on vidIQ)
- **Sources, in order of preference:**
  - vidIQ outlier tools (if they return "Not enough credits", don't retry)
  - Firecrawl web search for recent high-performing finance shorts
  - Firecrawl scrape of Instagram reel URLs (influencers-club gives play counts)
  - covers via `vidiq_get_images` (free)
  - unused references in `research/viral-references.json`
- **Labels:** tag every observation VERIFIED_FRAME / VERIFIED_COUNTS / AI_DESCRIPTION / ASSUMPTION. Never say "watched" unless frames were actually inspected.
- **Selection:** choose on BOTH performance evidence and Remotion reproducibility. Reject anything that depends on real footage, physical action, a personal identity or third-party clips.
- **Records:** write `research/research-notes/<DATE>.md` and add the references to the library.

## 3 · Concept, script, uniqueness
- **The idea:** one clear message with educational or emotional value. No generic quotes, no filler.
- **Rotation:** saving · investing · discipline · wealth · spending habits · meaningful messages.
- **The script:** natural and conversational, in the creator's voice. About 25–35 words, narration ≤ 12 s. Hook in 0–2 s. Every number goes in `facts.ts`; never imply guaranteed returns.
- **The treatment:** pick a NEW metaphor and visual treatment. Run `dmm.mjs search <metaphor words>` and `dmm.mjs check <ID>` (after `set metaphor` / `set visual_tags` / `set hook` / `set layout`). Fix every duplicate risk. No reused trays, columns, split dashboards or pipes as the hero.

## 4 · Narration (before any timing)
- `python3 video/scripts/daily/voice_tts.py <ID> "<script>"`: the creator's own voice from `config.narrator`, cached. Never create or clone a voice. Never regenerate to fix a mix.
- Copy `video/public/daily/voice/<ID>/words.json` into the episode's source folder. Every caption and major visual event is keyed to these word times.

## 5 · Build
- Create `video/src/daily/episodes/dmmNNN/{facts.ts,timing.ts,Episode.tsx}` and register it in `DailyRoot.tsx`.
- Reuse `video/src/daily/components/` (WordCaptions, Camera2D, FilmLook, Headline, Chrome …). Add new reusable components there.
- **Audio:** voice MP3 untouched on its own track, plus an SFX-only WAV generated from the episode's event timing (pattern: `video/scripts/daily/make_dmm003_sfx.py`). Follow `config.audio`: no music, fixed gain, ducked.
- **Episode package:** `metadata.json` with `narration.{file,offset_sec,script}` and `sfx_track` (the QC tool reads them).
- **The ending is designed:** after the voice ends, a payoff in motion; no static hold.

## 6 · Render → QC → self-correct (at most `production_limits.max_render_rounds`)
1. Run still rounds first (`node video/scripts/stills.mjs <Comp> <dir> name=frame … --props=<{showSafeZones:true}>`) and fix layout problems before any full render.
2. `bash video/scripts/daily/render.sh <ID> <Comp>`: versioned; never overwrites; runs the export checks **and** `qc_episode.py` automatically.
3. `python3 video/scripts/daily/qc_episode.py <ID> <mp4> --stt` once on the candidate final.
4. Open and judge: frame 0, 1 s, 2 s, every transition, the payoff, the last frame, the 4 motion strips and the contact sheet.
5. For each problem, write the **root cause**, fix the cause (not the symptom), re-render, and re-inspect the affected section **and** the whole output. No cosmetic churn.
6. If a problem has now happened twice across episodes, add it to `CHECKLIST.md` (and to `qc_episode.py` if it can be measured).

## 7 · Gate (honest)
- Write `episodes/<ID>/qc-report.md` with:
  - the automated table (copy `QC_AUTO.md`)
  - human-judgment scores 1–10 for: hook, script and accuracy, voice clarity and timing, SFX levels, captions, visual quality, transitions and camera, layout and safe zones, payoff, technical, originality, likely retention
  - the corrections made (with root causes)
  - remaining concerns and what was NOT verified, in particular: **"audio measured, not listened to"**
- `dmm.mjs gate <ID> <avg score> <qc_auto.json>` → **READY FOR MY REVIEW** (≥ 9 and 0 FAIL) or **NEEDS FIXING**. Never claim more than the gate gives.

## 8 · Deliver (always, even when it isn't finished)
- `cover.png`, `caption.md`, `metadata.json`, `script-storyboard.md`, `adaptation-notes.md`, `asset-manifest.json` in `episodes/<ID>/`.
- Commit to the episode branch `dmm/<date>` and push it, then run `bash daily-money-motion/scripts/sync_history.sh finish` so the base branch carries the new history.
- Send the MP4 (display "attach", full resolution) and cover with SendUserFile (status "proactive" on scheduled runs).
- Then send ONE short message:
  - the label (READY FOR MY REVIEW / NEEDS FIXING)
  - title and hook, a one-line concept, and the score
  - the voice/audio/1080×1920/30 fps/15.0 s confirmation
  - the top 3 corrections and the remaining concerns
- **If the hard stop hit:** label the file "REVIEW PREVIEW — NOT FINISHED", say exactly what's unresolved, and set the status to NEEDS_FIXING.
- **If no video exists at all** (for example a render failure), send a status report with the error and what was tried, and set the status to FAILED via `dmm.mjs status`.
