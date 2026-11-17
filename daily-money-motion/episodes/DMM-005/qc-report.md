# DMM-005 — quality-control report

**File:** `video/renders/daily/DMM-005/DMM-005_v03.mp4` · sha256 `47dbb1cda17a7f2fffec9b698c9461ede4337057fcb56bbf071ee7808ba4c11d`
**Gate: NEEDS FIXING.** Automated QC is 0 FAIL / 0 WARN (with speech-to-text), but the honest creative score is **8.8 / 10**, below the 9.0 gate.
**Renders:** v01 → v02 → v03 (3 of max 4), plus 2 still rounds. Only v03 is committed.
**Scheduled run** for 2026-11-17 (first production day of the 72 h schedule).

## Automated QC on the final (`qc_episode.py DMM-005 DMM-005_v03.mp4 --stt`)
| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -17.7 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -5.2 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.3 dBFS RMS vs everything else -55.6 dBFS → 38.3 dB below (min 20) |
| audio | SFX peak | PASS | -33.1 dBFS (max -24) |
| audio | no background music | PASS | 70 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-17.7 1s:-15.5 2s:-17.4 3s:-17.3 4s:-18.2 5s:-15.4 6s:-21.0 7s:-17.1 8s:-35.5 9s:-51.0 10s:-240.0 11s:-49.6 12s:-92.6 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 31/31 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.078 s |
| speech | STT audio events | PASS | none |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 27 distinct words OK |
| picture | frame 0 not blank | PASS | 3.13% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.80 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.7 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.707, 'DMM-002': 0.789, 'DMM-003': 0.789, 'DMM-004': 0.815} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping. **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| Hook | 9.0 | Frame 0 shows a complete, relatable line ("EVERYONE SEES YOUR CAR PAYMENT.") with the car on the visible tip |
| Script and accuracy | 9.0 | 31 words, one idea. $121K computed in `facts.ts` and asserted in code; "could grow"; EXAMPLE + assumptions + "not guaranteed" on screen 0–15 s |
| Voice clarity and timing | 8.5 | 31/31 words recognised by STT, max sync error 0.078 s; 8.1 s read |
| SFX levels | 9.0 | 38.3 dB under the voice, peak −33.1 dBFS, no music (residual test passes) |
| Captions | 9.0 | Word-synced, ≤2 lines per page, key words in emerald, spelling clean |
| Visual quality | 8.5 | Clear waterline split and readable mass; the facets still fan from one point (a little "pinwheel") |
| Transitions and camera | 9.0 | Motivated dive under the surface on "Nobody", pull-out on "under the surface" |
| Layout and safe zones | 9.0 | Auto safe-zone check passes; pill fades before the headline so nothing overlaps |
| Payoff | 8.5 | Stats ($84,000 put in → $121K) + constant push + glint; less of an "event" than a reveal |
| Technical | 9.5 | All export, audio and decode checks pass |
| Originality | 8.5 | New metaphor/layout for the channel (similarity ≤ 0.815), but the iceberg is a familiar wealth image and "car payment vs invest" is a common topic |
| Likely retention | 8.0 | Voice ends at 8.3 s; the last 6.7 s are visual-only |
| **Average** | **8.8** | |

## Corrections made (root cause → fix)
1. **Pill collided with the headline in the pulled-out view (still round 1).** The full-view framing was too tight (zoom 0.92, centred low). → Wider framing (0.88–0.9) centred higher; the pill also fades as the headline lands.
2. **Static end, 2.4 s then 1.9 s (v01, v02 WARN).** The only payoff motion was a ±4 px bob, then an eased push that stalled at both ends (QC measures per-frame change). → A constant-speed push anchored at the berg's base, plus swaying light shafts under water. Longest near-static stretch now 0.7 s.
3. **Visual similarity to DMM-004 0.87 / 0.86 (v01, v02 WARN).** Same dark stage, centred green object and the same two-row readout. → Tinted water body, diagonal light shafts and a side-by-side two-column stat layout. Similarity now 0.815.
4. **Facets read as a pinwheel (still round 1).** The facet centre sat on the axis. → Moved off-centre (partial improvement; still noted above).

## Remaining concerns / NOT verified
- **Audio measured, not listened to.** Loudness, SFX ratio, no-music and STT were measured; nobody has listened to the mix.
- **Metaphor shortcut:** the visible car payment and the invested money are *alternative* uses of the same $700, shown as one iceberg (seen vs unseen). The narration frames it that way; a strict viewer could read it as one person doing both.
- Voice ends at 8.3 s; the second half has no narration (retention risk).
- References were not watched (counts + captions only; see research notes). The "average car payment" figures quoted by those reels were NOT verified and are not used; our $700 is labelled EXAMPLE.
- ElevenLabs plan must allow commercial use (open item since DMM-003).
