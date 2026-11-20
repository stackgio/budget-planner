# DMM-006 — quality-control report

**File:** `video/renders/daily/DMM-006/DMM-006_v02.mp4` · sha256 `7830dfbde16ae58d3422854198e2a0054c67c57ac862c77072013d8d12796da8`
**Gate: NEEDS FIXING.** Automated QC is 0 FAIL / 0 WARN (with speech-to-text) and **clarity is 9.5**, but the average creative score is **8.96 / 10**, just below the 9.0 gate.
**Renders:** v01 → v02 (2 of max 4), plus 2 still rounds. Only v02 is committed.
**Scheduled run** for 2026-11-20 (first episode built under the new clarity rule, CHECKLIST B2).

## Clarity check (CHECKLIST B2)
- **One-sentence message:** six small $15 subscriptions you barely notice add up to $90 a month and over $1,000 a year, so check them.
- **Narration only:** short sentences (≤ 7 words each), everyday words, no jargon. ✅
- **Sound off:** a receipt anybody recognises: labelled lines (STREAMING, MUSIC, CLOUD STORAGE, AN APP, GYM YOU SKIP, ONE MORE · $15.00 each), PER MONTH $90.00, × 12 MONTHS, PER YEAR $1,080.00. ✅
- **Every symbol labelled:** the receipt is titled MONTHLY CHARGES; the side counter says "n SUBS". ✅
- **Takeaway in words on screen:** "SMALL CHARGES ADD UP. CHECK YOUR SUBSCRIPTIONS." ✅
- No comparison of two options in this episode, so the side-by-side rule doesn't apply.

## Automated QC on the final (`qc_episode.py DMM-006 DMM-006_v02.mp4 --stt`)
| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.0 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.8 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.5 dBFS RMS vs everything else -57.6 dBFS → 40.2 dB below (min 20) |
| audio | SFX peak | PASS | -33.9 dBFS (max -24) |
| audio | no background music | PASS | 78 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-18.6 1s:-17.4 2s:-17.4 3s:-17.4 4s:-18.9 5s:-17.7 6s:-18.0 7s:-17.2 8s:-14.9 9s:-19.3 10s:-20.5 11s:-53.8 12s:-240.0 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 36/36 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.091 s over 37 aligned words |
| speech | STT audio events | PASS | ['[bell dings]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 29 distinct words OK |
| picture | frame 0 not blank | PASS | 19.52% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.58 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.5 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.746, 'DMM-002': 0.805, 'DMM-003': 0.832, 'DMM-004': 0.833, 'DMM-005': 0.76} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping. **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| **Clarity** (gate ≥ 9) | **9.5** | A receipt is understood by anybody; every line is labelled; totals and the takeaway are in words |
| Hook | 9.0 | Frame 0: a big "$15 / MONTH" on a receipt + "FIFTEEN A MONTH FEELS LIKE NOTHING."; the paper feeds out from frame 0 |
| Script and accuracy | 9.0 | 37 plain words; $90 and $1,080 computed in `facts.ts`; cash totals, no interest claimed; EXAMPLE footnote 0–15 s |
| Voice clarity and timing | 9.0 | 36/36 words recognised by STT; max sync error 0.091 s; 10.4 s read |
| SFX levels | 9.0 | 40.2 dB under the voice, peak −33.9 dBFS, no music |
| Captions | 9.0 | One-thought pages, never more than 2 lines |
| Visual quality | 9.0 | Clean, high-contrast receipt; the 12-copy fan reads as "a year" |
| Transitions and camera | 8.5 | One setup by design (intro pull-back + slow drift); no cuts |
| Layout and safe zones | 9.0 | Auto safe-zone check passes; the paper stays inside the safe area |
| Payoff | 9.0 | PER YEAR counts $90 → $1,080 while 12 monthly copies fan out; takeaway in words |
| Technical | 9.5 | All checks pass |
| Originality | 8.5 | New metaphor and layout for the channel, but "subscriptions add up" is a common topic; similarity to DMM-004 is 0.833 (limit 0.85) |
| Likely retention | 8.5 | Voice runs to 10.6 s, then ~4 s of payoff |
| **Average (all 13)** | **8.96** | |

## Corrections made (root cause → fix)
1. **"CLOUD STORAGE" and "PER YEAR" wrapped to two lines and collided with the next line (still round 1).** Flex items could wrap. → `nowrap` + slightly smaller type.
2. **Printer collided with the two-line hook caption at frame 0 (still round 1).** The intro pull-back (1.25×) lifted the scene into the caption band. → Receipt moved 94 px lower.
3. **Spelling FAIL "app" (v01).** The offline dictionary doesn't contain "app". → Added to `config.json → qc_thresholds.allowed_words` (the existing mechanism, like "payday").
4. **"PER YEAR" touched "$1,080.00" in the green band (v01, full-res review).** No gap between label and value. → Explicit gap and smaller value type (v02).

## Remaining concerns / NOT verified
- **Audio measured, not listened to.**
- Average 8.96 < 9: mainly single-setup camera, a common topic and short retention runway.
- REF-0009 was not watched (verified counts + caption only; motion and sound are AI-description level).
- The six subscriptions and $15 price are an EXAMPLE, not real data.
- ElevenLabs plan must allow commercial use (open item since DMM-003).
