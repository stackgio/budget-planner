# DMM-007 — quality-control report

**File:** `video/renders/daily/DMM-007/DMM-007_v02.mp4` · sha256 `c05061907d65e7fc3c744834bed9e04e245a2d674e409b02739991d519c87350`
**Automated QC:** 0 FAIL / 0 WARN (with speech-to-text). **Clarity 9.5.** **Average creative score 9.0.**
**Renders:** v01 → v02 (2 of max 4), plus 1 still round. Only v02 is committed.
**Run:** episode for 2026-11-23, produced on the creator's "Run now" after the scheduled firing was blocked (the command-approval check returned no verdict). Delivered after the usual 07:00 ET slot.

## Clarity check (CHECKLIST B2)
- **One-sentence message:** a surprise $400 bill is common and more than 1 in 3 adults wouldn't cover it with cash, but $10 a week builds that cushion in 40 weeks.
- **Narration only:** 36 words, short sentences, no jargon. ✅
- **Sound off:** a cloud labelled "$400 SURPRISE" rains labelled bills (CAR REPAIR, DOCTOR BILL); three adults, one marked "✕ NOT COVERED"; "37% OF ADULTS WOULDN'T COVER A $400 SURPRISE WITH CASH*"; an umbrella labelled EMERGENCY FUND fills (WEEK 0 → 40, $0 → $400) and the mark turns "✓ COVERED". ✅
- **Every symbol labelled:** the cloud, the bills, the umbrella and the marks. ✅
- **Takeaway in words:** "A SMALL CUSHION BUYS CALM. START WITH $10 A WEEK." ✅

## Accuracy
- Statistic verified from the primary source: Federal Reserve, *Economic Well-Being of U.S. Households in 2025* (May 2026), executive summary and fact sheet: "Sixty-three percent of adults said they would cover a hypothetical $400 emergency expense exclusively using cash, savings, or a credit card paid off at the next statement." → 37% would not (computed in `facts.ts`; "more than one in three" asserted in code).
- Wording follows the survey: "**wouldn't** cover it with cash", not "couldn't pay" (the survey says most of the 37% would pay some other way; 12% couldn't pay at all).
- $10/week × 40 weeks = $400 is a labelled EXAMPLE (cash, no interest). Source and example are footnoted on screen for 0–15 s.

## Automated QC on the final (`qc_episode.py DMM-007 DMM-007_v02.mp4 --stt`)
| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.1 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -5.0 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.7 dBFS RMS vs everything else -57.8 dBFS → 40.2 dB below (min 20) |
| audio | SFX peak | PASS | -32.2 dBFS (max -24) |
| audio | no background music | PASS | 34 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-15.4 1s:-17.9 2s:-19.5 3s:-17.4 4s:-17.0 5s:-20.0 6s:-17.1 7s:-18.5 8s:-21.7 9s:-48.3 10s:-48.6 11s:-65.7 12s:-72.1 13s:-83.4 14s:-131.5 |
| speech | intelligibility (STT) | PASS | 33/33 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.069 s over 33 aligned words |
| speech | STT audio events | PASS | ['[chime]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 31 distinct words OK |
| picture | frame 0 not blank | PASS | 2.93% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.56 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.0 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.725, 'DMM-002': 0.749, 'DMM-003': 0.796, 'DMM-004': 0.813, 'DMM-005': 0.747, 'DMM-006': 0.803} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping. **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| **Clarity** (gate ≥ 9) | **9.5** | Universally understood pictures (rain, umbrella, ✓/✕), every symbol labelled, takeaway in words |
| Hook | 8.5 | Frame 0: "$400 SURPRISE" cloud + rain + "A FOUR HUNDRED DOLLAR SURPRISE." The people only arrive at 3 s |
| Script and accuracy | 9.5 | Verified Fed statistic, survey-accurate wording, every number in `facts.ts` |
| Voice clarity and timing | 9.0 | 33/33 words recognised by STT (numbers normalised); max sync error 0.069 s; 8.4 s read |
| SFX levels | 9.0 | 40.2 dB under the voice, peak −32.2 dBFS, no music (rain is a very low SFX texture) |
| Captions | 9.0 | One-thought pages, never more than 2 lines |
| Visual quality | 8.5 | Clean and readable; the people are simple icons |
| Transitions and camera | 8.5 | One setup by design (intro pull-back + slow drift) |
| Layout and safe zones | 9.0 | Auto safe-zone check passes; nothing overlaps |
| Payoff | 9.0 | The umbrella fills week by week to $400; the rain stops on it; NOT COVERED → COVERED; takeaway in words |
| Technical | 9.5 | All checks pass |
| Originality | 9.0 | New metaphor and new topic for the channel (emergency fund); similarity ≤ 0.813 |
| Likely retention | 8.5 | Voice ends at 8.6 s; ~6 s of continuous payoff motion after it |
| **Average (all 13)** | **9.0** | |

## Corrections made (root cause → fix)
1. **"✕ NOT COVERED" pill wrapped to two lines (still round).** → `nowrap`, slightly smaller type.
2. **The 37% statistic wrapped into the source footnote (still round).** One long line. → Two deliberate lines ("37% OF ADULTS" / "WOULDN'T COVER A $400 SURPRISE WITH CASH*").
3. **"EMERGENCY FUND" label floated far above the umbrella (still round).** → Moved onto the canopy.
4. **Umbrella handle drawn through the person's head (v01, full-res review).** The handle was drawn above the people. → Handle drawn behind solid figures, so it reads as held.
5. **Shielded raindrops splashed on the label, not the canopy (v01).** → Splash points follow the canopy curve.
6. **False STT WARN 34/35 (QC-tool bug).** STT wrote "four hundred dollar" as "$400". → `qc_episode.py` now drops a currency word that follows a number on both sides; checked offline against DMM-005/006/007 transcripts (all full match).

## Remaining concerns / NOT verified
- **Audio measured, not listened to.**
- **No viral reference this time:** the topic was chosen for the meaningful-messages pillar from a primary data source (Fed SHED), not from a performing short. Its performance on short-form is an ASSUMPTION.
- Rain keeps falling on the two "COVERED" people (intended: surprises hit everyone; they can cover it), but a literal viewer might wonder why.
- ElevenLabs plan must allow commercial use (open item since DMM-003).
