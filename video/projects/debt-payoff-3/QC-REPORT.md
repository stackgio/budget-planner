# QC report — "3 Things to Do While Paying Off Debt" (Production System 2.0 test)

**Date:** 2026-10-29 · **Composition:** `DebtPayoff3Things` · **File:** `3-things-paying-off-debt_TEMP-TIMING_no-vo.mp4`

## Status: test render with temporary timing — NOT voiceover-synchronised

- **No voiceover was supplied.** Timing comes from a pace model calibrated on the creator's previous take. The cut is about 52 s. That is over the 40–50 s target, and the real length depends on the recording.
- **Marcus is the existing debt-story rig,** not an upgraded character. The Phase 3 rig from the studio audit has not been built. The debt-story branch has no PR and no recorded approval.

## Verified (measured, not assumed)

| Check | Result |
|---|---|
| Export | H.264 High, 1080×1920, 30/1 fps, yuv420p, 1,562 frames, 52.075 s, AAC 48 kHz stereo |
| Decode | Clean (ffmpeg full decode, no errors) |
| Blank frames | 0 of 1,562 below luma threshold (min YAVG 29.4) |
| Audio | SFX only (no VO, no music): peak −13.8 dBFS, integrated −29.9 LUFS. **Loudness can't be judged until the VO is mixed in** |
| Financial math | `npx tsx scripts/dp3-check.ts`: 16/16 pass. $0→$500 (goal $500–$1,000), $50×4 = $200 with the $50/$100/$150/$200 staircase, $100×4 = $400, $1,000 − $300 = $700, $700 + $300 = $1,000. Every counter lands exactly on its final value with no overshoot. No overlapping phrases and no gaps between scenes |
| Disclaimer | "Simplified example. Excludes interest and fees." is on screen for the whole card scene, at 26 px |
| Illustrative labels | Hook balance marked EXAMPLE. Payoff meter shows "IN PROGRESS" with no invented percentage |
| Typecheck | `tsc --noEmit` clean. `GraphVideo` untouched; `Root.tsx` change is additive |

**Inspected:** 16 + 12 + 6 full-resolution stills, 8 motion strips across every transition (half-res preview), and an 18-frame contact sheet of the final.

**Not verified:** no one has *watched* the video in real time with sound. Strips show motion sampled every 3–37 frames, not continuous playback. Caption sync to speech can't be verified without audio.

## Problems found and fixed during QC

1. Frame 0 had no headline (it faded in). Now readable on frame 0.
2. Two Marcuses on screen during the hook→fund and ending→CTA crossfades. The incoming Marcus now waits.
3. Tracker pills collided mid-flight during the morph. They're now staggered and their type shrinks early.
4. The flat tyre didn't read as flat. Added a red inspection ring and a FLAT tag.
5. "Swipe the card" overlapped the card art. "SELL UNUSED STUFF" ran under its +$ chip. "PAYING IT OFF IS ONE / THING." orphan. Headline nearly touched the frame edges. Weeks counter read "AFTER 1 WEEK $0" before any week landed.
6. Marcus stood still for 1.7 s at the start of the tyre scene. He now walks up to the car.

## Scores (1–10, not inflated)

| Category | Score | Why |
|---|---|---|
| Marcus animation | **5** | Consistent proportions, backward black cap and clear expressions. But it's the old rig. Limbs are rigid two-segment strokes, pose changes are plain eased interpolations with little anticipation or follow-through, and the "inspect" crouch reads awkwardly. Hands-on-head covers the cap. The walk cycle's foot-plant isn't measured, so it may skate. Marcus is absent from 3 of 9 beats (comparison, weeks, card) |
| Storytelling | **7** | Every spoken idea has a concrete visual. The two-column outcome and the card ledger make the lessons instant, and the tracker gives a clear "3 things" structure with a satisfying callback on "habits". Weak: the income section is mostly a checklist, and the on-screen question ("biggest debt struggle?") differs from the spoken question ("hardest part?") while both are on screen together |
| Typography | **7** | One family (Inter), clear hierarchy, tabular numbers, good contrast. Weak: up to four text layers at once (tracker, header, panel copy, captions), tracker labels at 23 px are small on a phone, and some kickers are 22–26 px |
| Camera movement | **5** | Slow drifts, one motivated push-in (the tyre) and shake on two impacts. No other motivated moves: no push to the result number, no rack to Marcus on emotional lines. Transitions carry most of the motion |
| Financial graphics | **8** | Exact counters, cumulative staircase, three-line ledger that proves "back to $1,000", balance bar proportional to the balance, disclaimer present. Weak: the $12,480 hook balance is invented (labelled EXAMPLE), and the outcome columns show no amounts |
| Scene transitions | **6** | Two strong ones: the step rows becoming the tracker, and the expense card match-cut from street to comparison. The rest are generic push/fade/zoom with brief semi-transparent overlaps. About 0.4 s around 4.3 s shows only the flying pills on an empty background |
| Pacing (provisional) | **6** | Timed to a model, not a voice. The comparison payoff holds about 1.3 s. The income rows arrive every 0.6–0.8 s, which is dense. The cut runs 52 s against a 40–50 s target |
| Overall professional appearance | **6** | Clean, on-brand and clearly better than a slideshow. Numbers are trustworthy and the layout respects safe zones. It's held back by the old Marcus rig, limited camera language and dense text layering. Reads as a strong template, not yet a polished edit |

## Recommended improvements (specific)

1. **Record the voiceover, then retime** (`timing.ts`, one table). Re-check the comparison hold and the income-row density against real delivery. If it runs past 50 s, trim script words rather than squeezing visuals, e.g. "That could mean working overtime, extra shifts, DoorDash, or selling stuff".
2. **Align the closing text with the spoken question**: either show "WHAT'S BEEN THE HARDEST PART?" or change the VO to "What's your biggest debt struggle?". Avoid two different questions at once.
3. **Build the Phase 3 Marcus rig before judging character quality.** Tapered continuous limbs, anticipation and overshoot per action, foot-planted walk with a slide metric, a proper crouch, and a hands-on-head pose that keeps the cap visible. Then re-render this composition unchanged as the comparison.
4. **Put Marcus in the card scene.** He makes the payment, then shrugs at the new purchase. The lesson is behavioural and currently has no character.
5. **Motivated camera:** push 6–8 % onto the $200 total and onto "BACK TO $1,000". Make a slight rack toward Marcus on "I'm working toward becoming debt-free".
6. **Fill the 0.4 s empty beat in the hook morph.** Start the step-1 header slam as the pills leave, or let the balance card shrink into the tracker instead of fading.
7. **Reduce text layers.** Hide the tracker while the big step header is up, or drop the header after 1.5 s. Raise the tracker type to ≥ 26 px.
8. **Add amounts to the outcome columns** (e.g. a $180 tyre covered by $500 → $320 left) only if the creator wants a concrete figure, and label it illustrative.
9. **Watch it in real time with the VO** before calling it final. The frame strips can't judge rhythm.
