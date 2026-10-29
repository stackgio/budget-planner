# Stack With Gio — Studio Upgrade Audit (Phase 1)

**Date:** 2026-10-29  **Baseline commit:** `6fcef84` (main)  **Status:** Audit only. No source, dependency or asset changes were made.

---

## 0. Executive summary

The repository holds **one engine**, a well-built and data-honest historical investing graph pipeline (`/graph` + `video/`). It typechecks, renders a correct 1080×1920 H.264 file and passes its own self-test. Its financial pipeline is careful: closing prices, split-adjusted math, `{token}` numbers, UNVERIFIED flags, and assumptions in the footnote.

The rest of the brief **does not exist yet in this repo**. There is no Marcus character code, reference image, stickman animation, kinetic typography, explainer objects, audio, captions, storyboard system or motion library. The `/graph` command explicitly bans stickmen from graph videos. `stackgio/budget-planner` is the only repository this account can access, so the existing stickman animations you described must live somewhere else (your computer, another tool, or a repo not connected here). **I need them, or the Marcus reference image, before Phase 3.**

So this is mostly an **additive build around a solid core**, not a repair job. The safest plan keeps `GraphVideo` and `/graph` byte-for-byte working. New engines go beside them, and a regression check proves the graph engine hasn't changed.

---

## 1. What was inspected and how

| Item | Finding |
|---|---|
| Git | Clean working tree, detached at `main` = `6fcef84`. 4 commits of real work (PRs #3–#5). No uncommitted work at risk. |
| Layout | `README.md` (1 line), `.claude/commands/graph.md` (the `/graph` playbook), `video/` (the Remotion project). |
| Node / npm | Node 22.22.0, npm 10.9.4 |
| Python | 3.13 (scripts use the standard library only) |
| FFmpeg / ffprobe | 6.1.1, at `/usr/bin` |
| Browser | Playwright Chromium headless shell at `/opt/pw-browsers`, auto-detected by `render.sh` |
| Remotion | `remotion` + `@remotion/cli` **4.0.538** (pinned) |
| React / TS | React 18.3.1, TypeScript 5.6.3 (strict), `tsx` for scripts |
| Other deps | `zod` 3.22.3, `@fontsource/inter` 5.1.1 |
| Lockfile | `package-lock.json` present and consistent (`npm ci` succeeded) |
| Compositions | **1**: `GraphVideo`. Duration comes from `spec.json` via `calculateMetadata`. |
| Assets | None committed. `public/logos/`, `data/` and `projects/` hold only `.gitkeep`. No fonts beyond bundled Inter, no audio, no images. |
| Tests | `scripts/selftest.sh` (synthetic end-to-end) and `scripts/qc.sh` (ffprobe, decode check, frame extraction, contact sheet). No unit tests. |

**Baseline verification.** All of this ran in a scratch copy, so your tree was not touched; the self-test overwrites the tracked `src/placeholder-spec.json`.
- `npm ci` from the existing lockfile: OK. No versions changed.
- `tsc --noEmit`: **OK**
- `bash scripts/selftest.sh --full`: **PASSED**. Lump-sum, compare and DCA stills rendered; the full 22 s MP4 rendered in about 2 min 40 s.
- `qc.sh`: h264 High, 1080×1920, 30/1 fps, yuv420p, 660 frames, 22.000 s, decode clean.
- `npx remotion versions`: warns that **zod 3.22.3 is installed but 4.5.4 is expected** (see P2-9).
- I opened and inspected the contact sheet, `event1_hold`, `event2_hold`, `result_card` and the compare still. The visual findings below come from those frames.

---

## 2. Prioritised problems

Severity: **P1** = wrong output or blocks the brief · **P2** = quality or capability gap · **P3** = polish or hygiene.
Evidence: **[verified]** = reproduced or seen in rendered frames · **[code]** = from reading the code, not yet reproduced.

### P1 — must fix

| # | Problem | Evidence | Impact |
|---|---|---|---|
| P1-1 | **Engine B is missing entirely.** No Marcus code, no reference image, no existing stickman in any accessible repo. | [verified] repo search and repo list | Blocks the top priority until you supply the reference or source files. |
| P1-2 | **DCA dividends are over-credited.** When a monthly buy lands on an ex-dividend date, the shares bought at that close also receive that day's dividend. Buyers on the ex-date are not entitled. | [verified] unit repro: 10 shares held plus 10 bought on the ex-date at $1/share paid **$20; correct is $10** | Small but systematic overstatement in DCA + dividend videos, which breaks "never double-count dividends". Lump sum is correct because of an `i > 0` guard. |
| P1-3 | **Event push-in crops the chart.** At zoom 1.2 on a late event, the y-axis, all y labels and the left of the L-axis leave the frame, the peak overshoots the top, and year labels are cut in half. | [verified] `event2_hold.png` | Viewers lose the scale at the most important moment. |
| P1-4 | **`{T.years:int}` rounds up the holding period.** 2016-01-04 → 2026-10-23 is 10.8 years but renders as "**in 11 years**". | [verified] `result_card.png` | Overstates the period, so the claim is not literally true. |
| P1-5 | **Tone (green/red) is manual and never checked against the data.** A +159% result rendered in red. The self-test story set `"tone":"down"`, but nothing guards against it. | [verified] `result_card.png` | Colour can contradict the number, which hurts trust. |
| P1-6 | **Dividend-basis safety nets are soft.** (a) The DRIP vs adjusted-close comparison only prints a % difference and never fails. (b) `auto` silently falls back to Stooq, whose close is also dividend-adjusted, while the auto footnote says "price only, dividends excluded". | [code] `compute.py`, `fetch_prices.py`, `build_spec.py` | A video could label a total return as price-only. |

### P2 — capability and quality gaps

| # | Problem | Evidence |
|---|---|---|
| P2-1 | **No audio pipeline.** No `<Audio>`, voiceover, SFX, music, fades, loudness or clipping check. `qc.sh` expects 0 audio streams. | [code] |
| P2-2 | **No kinetic typography or captions engine.** Only the hook/question header exists. No word timing, no caption track. | [code] |
| P2-3 | **No shared motion library.** Easings, springs and camera logic are inline in each component. No transitions, no `Sequence`/`Series` scene structure. | [code] |
| P2-4 | **No storyboard or scene system.** One composition with a fixed arc: result at −7 s, question at −3.4 s. Every graph video has the same rhythm. | [code] `timeline.ts` |
| P2-5 | **No financial explainer objects** (cards, bills, phones, meters, transfers) and no tested TypeScript money math for them. | [code] |
| P2-6 | **Compare mode legibility.** The second series is ink `#111827`, which looks the same as the black "Invested $X" pill. The winner's colour also reveals the ending from frame 0. | [verified] compare still |
| P2-7 | **Dividend timing convention.** Dividends are reinvested at the ex-date close (a common, defensible convention). You asked for payment dates, but the provider only supplies ex-dates. | [code] → decision D6 |
| P2-8 | **DCA has no annualised return** (no money-weighted XIRR). Compare-mode date alignment drops dividends whose ex-date isn't a shared trading day (e.g. crypto vs stock). | [code] |
| P2-9 | **zod version mismatch** (3.22.3 vs 4.5.4 expected by Remotion 4.0.538). Rendering works; the Studio props editor may misbehave. | [verified] `remotion versions` |
| P2-10 | **QC is extraction-only.** No automated checks for text clipping, safe zones, blank frames, duration drift, audio peaks or subtitle sync. | [code] |
| P2-11 | **No unit tests** for `compute.py` / `build_spec.py`, which are the money-critical code. | [code] |

### P3 — polish and hygiene

| # | Problem |
|---|---|
| P3-1 | A constantly pulsing ring on the line tip runs the whole draw, against "not everything needs to move". |
| P3-2 | `selftest.sh` overwrites the tracked `src/placeholder-spec.json` (it's deterministic, but it still dirties git). |
| P3-3 | The graph engine's look is white editorial, while the brief's brand is matte black + bright green + white (decision D3). |
| P3-4 | The lower ~360 px stays empty. This respects the platform UI zone, but there's room to tighten the vertical composition. |
| P3-5 | The root `README.md` is one line. There's no CHANGELOG and no rollback notes. |
| P3-6 | Footnote text is 21 px `#9CA3AF` on white: legible but low contrast. |

---

## 3. What to keep (reusable as-is)

- **The data pipeline** (`fetch_prices → compute → build_spec`). Tokenised numbers, UNVERIFIED detection, split handling, intraday-vs-close separation and CPI baselines are the right foundation for Engine A and for every number in Engines C/D.
- **`lib/timeline.ts`.** Every visual reads one frame→data-index timeline, so the chart, counter and callouts can't drift. This pattern generalises to voiceover-driven timelines.
- **`calculateMetadata` with schema-validated `spec.json`.** This is the model for every new composition.
- **`qc.sh` plus `timeline-report.ts` frame planning.** Extend it rather than replace it.
- **`render.sh` export settings** (H.264 High, yuv420p, bt709, CRF 16).

---

## 4. Proposed architecture (additive, inside `video/`)

Existing files stay where they are. New folders go beside them. The `GraphVideo` composition ID, its props and the `/graph` command keep working unchanged.

```
video/
  src/
    Root.tsx                 # + registers new compositions (GraphVideo untouched)
    GraphVideo.tsx, components/, lib/   # Engine A (existing) — fixes only, same API
    design/                  # NEW tokens: brand-dark (matte black/green/white) + existing editorial-white
      tokens.ts  type-scale.ts  safe-zones.ts
    motion/                  # NEW deterministic, frame-based utilities
      easing.ts  springs.ts (named presets)  camera.ts (push/pan/track with safe-bounds clamp)
      transitions.ts  counter.ts  reveal.ts  parallax.ts  motionBlur.ts
    typography/              # NEW Engine C
      KineticLine.tsx  WordEmphasis.tsx  NumberTicker.tsx  ProgressBar.tsx  CaptionTrack.tsx
    character/marcus/        # NEW Engine B (behind a flag until approved)
      skeleton.ts            # bone hierarchy + fixed lengths (single source of proportions)
      fk.ts                  # forward kinematics → joint positions
      Marcus.tsx             # layered SVG: continuous limb paths, head, backward cap, face
      poses.ts  expressions.ts  # typed approved library
      actions/               # walk (foot-planted), run, sit, point, phone, laptop, celebrate…
      props/                 # phone, laptop, cash, credit card, chair, desk
    explainer/               # NEW Engine D
      CreditCard.tsx  BankAccount.tsx  Paycheck.tsx  Bill.tsx  Receipt.tsx  Calculator.tsx
      DebtMeter.tsx  SavingsGoal.tsx  TransferFlow.tsx  PhoneApp.tsx  BudgetBreakdown.tsx
      money.ts               # integer-cents math, tested; every transfer conserves money
    story/                   # NEW storyboard → video
      storyboard.schema.ts   # zod: scenes, VO segments, visuals, camera, SFX, text, transitions
      StoryVideo.tsx         # generic composition rendering a storyboard with <Series>/<TransitionSeries>
      scenes/                # scene templates per engine
    audio/                   # NEW
      Voiceover.tsx  SfxTrack.tsx  Music.tsx (only when licensed + requested)  captions.ts
    compositions/            # NEW test reels: MarcusTestReel, TypographyTest, ExplainerTest, EngineAShowcase
  scripts/
    qc.sh                    # extended: audio peaks/loudness, duration, blank-frame, safe-zone report
    qc/layout-check.ts       # NEW renders marked frames, reads DOM boxes → clipping / safe-zone violations
    qc/rig-check.ts          # NEW Marcus: bone-length invariance, joint connectivity, foot-slide metric
    tests/                   # NEW python unittest (stdlib) for compute.py / build_spec.py
    storyboard.py|ts         # NEW script → storyboard draft
  public/
    marcus/  (reference/, approved/)   audio/{vo,sfx,music}/   screenshots/   backgrounds/   logos/
  projects/<slug>/           # per-video: scenario/story or storyboard, data, out.mp4, qc/, REPORT.md
.claude/commands/
  graph.md                   # existing
  video.md                   # NEW full 10-step pipeline (script → storyboard → render → QC → report)
```

**Marcus rig approach (recommended).** A forward-kinematics SVG skeleton written in code:
- **Each limb is one continuous tapered path** (shoulder→elbow→wrist), so limbs can't detach by construction.
- **Bone lengths and head size are constants in `skeleton.ts`**, so proportions can't drift. A test checks this on every frame.
- **Poses are typed joint-angle sets.** Transitions interpolate the angles with easing plus anticipation and overshoot, which avoids linear "robot" tweens.
- **Walk and run use planted feet.** Body translation is derived from stride length, and a QC metric measures planted-foot slide (target ≈ 0 px).
- **The cap is parented to the head transform**, so it is always placed consistently. Expressions are a parameter set (brows, eyes, mouth, blink) that interpolates smoothly.

Alternative: a Rive or Lottie rig built by an animator in a dedicated tool. It has a higher artistic ceiling, but it needs outside authoring and a new dependency. See decision D2.

**Honest expectation.** A code rig can be clean, consistent and noticeably better than disconnected circles and lines. It will not match a skilled hand-keyed character animator. I'll show you test frames, not claims.

---

## 5. Six-phase roadmap

Each phase gets its own branch and PR, is additive, and ends with a render plus visual inspection before I ask for approval.

### Phase 1 — Audit ✅ (this document)

### Phase 2 — Core motion engine + Engine A fixes
1. Tag the baseline `pre-studio-upgrade` at `6fcef84`. Record golden stills from the self-test.
2. Build `design/` tokens, the `motion/` library (easings, spring presets, a camera that clamps to safe bounds, transitions, counters) and `typography/` primitives.
3. Fix P1-2 to P1-6 in the graph engine:
   - **P1-2:** apply dividends before same-day buys.
   - **P1-3:** keep axes and labels in frame during push-ins.
   - **P1-4:** use a `years1` format and ban rounding up.
   - **P1-5:** auto-derive tone from the sign, with a warning when you override it.
   - **P1-6:** hard-fail the DRIP check beyond a tolerance, and label Stooq data correctly.
4. Fix P2-6 (compare colours) and P3-1 (calm the tip pulse).
5. Add stdlib unit tests for `compute.py` / `build_spec.py`.

### Phase 3 — Marcus rebuild (after you supply the reference)
1. Trace the approved reference into a layered SVG and lock the proportions in `skeleton.ts`.
2. Build the FK rig, the pose library, all 11 expressions and the actions: walk, run, sit, stand, point, phone, laptop, count money, hold cards, pay bills, celebrate, react, look at chart, talk to a second character.
3. Write `rig-check.ts` (bone lengths, connectivity, foot slide, head ratio).
4. Render `MarcusTestReel` (≥ 8 actions, ≥ 6 expressions) and a contact sheet. **Stop for your approval.** The production Marcus stays untouched until then.

### Phase 4 — The four engines
- **A:** reusable templates (lump sum, DCA, compare, inflation, DRIP), and a DCA XIRR fact.
- **B:** a Marcus scene kit (environments, props, two-character dialogue).
- **C:** kinetic typography layouts (an emotional and an educational set).
- **D:** explainer objects with tested money math. For example, a $100 payment visibly leaves cash and reduces debt by exactly $100.

Each engine gets a working test composition, renders, and is inspected.

### Phase 5 — Storyboard + audio workflow
- **Storyboard:** a script → storyboard draft (hook, secondary hook, beats, emotion, numbers, visuals, actions, SFX, CTA), using the zod storyboard schema and the `StoryVideo` composition. Duration follows the story.
- **Audio:** voiceover import, word timings (decision D5), the caption track, SFX at chosen points, fades and ducking. Music only when it's licensed and you ask for it.
- **Previews:** low-resolution preview renders (`--scale=0.5`).

### Phase 6 — QC + final testing
1. Full automated QC suite (section 6) plus a per-video `REPORT.md`.
2. Render and inspect four representative videos, one per engine. Compare them side by side with the current system on the same subjects.

---

## 6. Measurable acceptance criteria

| Area | Criterion |
|---|---|
| Regression | Every phase: `selftest.sh --full` passes, and GraphVideo stills match the golden baseline (SSIM ≥ 0.999) except where a fix intentionally changes them, which is listed in the CHANGELOG. |
| Export | ffprobe: h264, 1080×1920, 30/1, yuv420p, AAC 48 kHz when audio is present. Duration within ±1 frame of the spec. Decode clean. |
| Finance | Unit tests: the lump-sum value equals the price ratio exactly. The DCA contribution count is exact. A buy on the ex-date earns no dividend. DRIP is within 0.5% of the provider's adjusted-close total return (or the build fails). Every number on screen comes from a token (0 UNVERIFIED). No "N years" rounds up. |
| Layout | Automated: 0 text elements outside the safe zone (top 170, bottom 330, right 120) or clipped, at every marked frame. Minimum font ≥ 24 px for body copy. |
| Camera | At every event hold, the y-axis line and ≥ 2 y labels are visible, and the event point is inside the plot. |
| Marcus | Bone lengths constant to ±0.5 px across all frames. 0 disconnected joints (by construction plus test). Planted-foot slide ≤ 2 px per frame during walks. Head:body ratio constant. Cap anchor error ≤ 1 px. You approve the test reel. |
| Blank frames | No frame with luma variance below a threshold, except intentional black frames that are listed. |
| Audio | True peak ≤ −1 dBTP. Integrated loudness about −14 LUFS (platform target, configurable). No clipped samples. Captions within ±2 frames of word timings. |
| Explainer math | Every transfer animation conserves money in integer cents. Interest examples match a reference formula. Illustrative scenes carry an "Illustrative example" label. |
| Human gate | No video is called done until the contact sheet and key frames have been opened and reviewed. Automated checks don't judge artistic quality. |

---

## 7. Missing assets and decisions I need from you

### Assets
1. **Marcus reference image(s)**: your approved design (front, side and ¾ if you have them). This is required before Phase 3.
2. **Your current stickman animations or source files**, so I can see exactly what looks cheap and preserve what you like. They aren't in this repo.
3. **Brand files:** logo or wordmark (SVG), exact hex for the "bright green" and "matte black", and a brand font if it isn't Inter.
4. **Voiceover recordings** (WAV/MP3) for any video meant to have narration.
5. **SFX library** you hold the rights to, or approval to use a specific royalty-free source.
6. **Real screenshots** for personal-journey videos. I will never generate account evidence.

### Decisions
| ID | Decision | My recommendation |
|---|---|---|
| D1 | Where do the stickman videos live? Connect that repo or upload the files? | Upload or connect so the audit can include them. |
| D2 | Marcus rig technology: in-code FK SVG, or a Rive/Lottie rig built by an animator? | In-code FK SVG first. It needs no new tools and is testable. Revisit if the reel isn't good enough. |
| D3 | Graph videos: keep the white editorial look, or move to matte black + green? | Keep white for graphs (proven readability), use matte black for story, explainer and typography videos, and support both themes. |
| D4 | Dependency additions in Phase 2+: `@remotion/transitions`, `@remotion/paths`, `@remotion/media-utils` (same 4.0.538 version), and upgrading zod to 4.x for the Studio warning. | Approve the three Remotion packages. Upgrade zod only after a regression run. |
| D5 | Word-level caption timing source: a transcript you supply, a Whisper-based local tool (new dependency), or Descript (available here as a connector)? | Descript or your transcript first, so no heavy local dependency. |
| D6 | DRIP convention: reinvest at the ex-date close (current, standard, data-available) or the payment date (needs pay-date data per dividend)? | Keep ex-date and disclose it on screen. Pay-date needs a second data source. |
| D7 | Remotion licence: free for individuals and companies of up to 3 people. Larger for-profit companies need a company licence. | Confirm which applies to you. |
| D8 | Should test reels and QC frames be committed, or stay local or attached only? | Don't commit MP4s. Commit `REPORT.md` and specs. |

---

## 8. Rollback strategy

1. **Baseline tag:** `git tag pre-studio-upgrade 6fcef84` before Phase 2. `git checkout pre-studio-upgrade` restores the current engine exactly.
2. **One branch and PR per phase.** Nothing lands on `main` without your merge. Reverting a phase means `git revert -m 1 <merge-commit>`.
3. **Additive only.** New folders and new composition IDs. `GraphVideo`, its spec schema and the `/graph` command stay backward-compatible. Engine A fixes that change numbers (P1-2, P1-4) are listed in the CHANGELOG with before/after values.
4. **Golden-frame regression** (SSIM against baseline stills) runs in every phase to prove nothing changed by accident.
5. **Dependencies:** each change is a separate commit touching only `package.json` and the lockfile, so `git revert` plus `npm ci` restores it.
6. **Approved assets are never overwritten.** New Marcus versions go to `public/marcus/approved/vN/`. Production references pin a version.
7. **`CHANGELOG.md`** is updated in every phase, with a "how to roll back" line per entry.

---

## 9. Notes on this audit

- No tracked files were modified. Only this file was added (not committed).
- `npm ci` and the self-test ran in a throwaway scratch copy, outside the repo.
- Findings tagged **[code]** come from reading the code and haven't been reproduced yet. Phase 2 starts by writing a failing test for each one before fixing it.
