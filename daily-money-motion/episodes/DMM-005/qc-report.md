# DMM-005 — quality-control report (v2, clarity rework)

**File:** `video/renders/daily/DMM-005/DMM-005_v06.mp4` · sha256 `e3b19b07e26cfd0ce94de6143bb01870b0e94145cf707ef63ff1f84f892563c1`
**Gate: NEEDS FIXING.** Automated QC is 0 FAIL / 0 WARN (with speech-to-text) and **clarity is 9.0**, but the average creative score is **8.8 / 10**, below the 9.0 gate.
**Why a v2:** creator feedback on v03 (2026-11-18): *"Is it saying everyone is paying $700 but won't invest? I'm confused."* v03 drew the two choices (spend on a car / invest) as ONE iceberg, so it read as one person doing both. v2 makes it two people, side by side, with the comparison said out loud.
**Renders this revision:** v04 → v05 → v06, plus 2 still rounds (v01–v03 were the first version).

## What changed for clarity
| v03 (confusing) | v2 / v06 (clear) |
|---|---|
| "Everyone sees your car payment. Nobody sees what you invest." (no comparison word) | "**Two people**, same seven hundred a month. **One** spends it on a car payment, and everyone sees it. **The other** invests it **instead**, and nobody sees it. Ten years later, **the investor** could have about a hundred twenty thousand." |
| One iceberg: car on top, investing below | **Two icebergs**, labelled **PERSON A** / **PERSON B**, divided by a line |
| No role labels | Pills: "SPENDS IT · CAR PAYMENT" vs "INVESTS IT INSTEAD"; tags "EVERYONE SEES IT" vs "NOBODY SEES IT" |
| One number at the end | Side by side at the bottom: **A · INVESTED $0** vs **B · AFTER 10 YEARS $121,160** |
| End line "BUILD WHAT NOBODY SEES." | Takeaway in words: **"SAME $700 A MONTH. SPEND IT, OR GROW IT."** |

**Sound-off test:** the labels alone tell the story (two people, same $700, one spends it on a car, one invests it, $0 vs $121K).
**Narration-only test:** the script names both people and says "instead", so it works with no pictures.

## Automated QC on the final (`qc_episode.py DMM-005 DMM-005_v06.mp4 --stt`)
| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -17.0 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.3 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -16.7 dBFS RMS vs everything else -56.0 dBFS → 39.4 dB below (min 20) |
| audio | SFX peak | PASS | -32.9 dBFS (max -24) |
| audio | no background music | PASS | 59 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-21.5 1s:-16.6 2s:-17.6 3s:-15.6 4s:-15.7 5s:-15.7 6s:-16.2 7s:-17.2 8s:-15.3 9s:-17.6 10s:-39.5 11s:-51.8 12s:-61.7 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 35/35 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.072 s over 39 aligned words |
| speech | STT audio events | PASS | ['[chime]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 30 distinct words OK |
| picture | frame 0 not blank | PASS | 0.87% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.41 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.2 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.697, 'DMM-002': 0.749, 'DMM-003': 0.729, 'DMM-004': 0.76} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping. **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| **Clarity** (new, gate ≥ 9) | **9.0** | Both the narration-only and the sound-off tests pass; the comparison is said and shown. Small minus: at frame 0 the PERSON A/B labels sit a little dim under the caption band |
| Hook | 8.5 | "Two people," sets up the comparison instantly, but it's less punchy than v03's "Everyone sees your car payment" |
| Script and accuracy | 9.0 | 39 plain words, short sentences; $121K computed in `facts.ts`; "could have"; EXAMPLE + assumptions + "not guaranteed" on screen 0–15 s |
| Voice clarity and timing | 9.0 | 35/35 words recognised by STT (numbers normalised), max sync error 0.072 s; 10.1 s read with natural pauses |
| SFX levels | 9.0 | 39.4 dB under the voice, peak −32.9 dBFS, no music |
| Captions | 9.0 | Shorter pages (never more than 2 lines), key words in emerald |
| Visual quality | 8.5 | Clean and readable; the facets still fan from one point |
| Transitions and camera | 8.5 | Mostly one wide shot by design (clarity over camera moves): intro pull-back + slow drift |
| Layout and safe zones | 9.0 | Auto safe-zone check passes; two clear columns |
| Payoff | 9.0 | $0 vs $121,160 side by side + the takeaway in words |
| Technical | 9.5 | All checks pass |
| Originality | 8.5 | Similarity ≤ 0.76 to past episodes; "car payment vs invest" is still a common topic |
| Likely retention | 8.5 | Voice now runs to 10.3 s; ~4.7 s of visual payoff after it |
| **Average (all 13)** | **8.8** | |

## Corrections made in this revision (root cause → fix)
1. **Viewer confused (creator feedback).** Two alternatives were merged into one object and the narration had no comparison word. → Two labelled people side by side; script says "Two people… One… The other… instead"; takeaway written on screen. Clarity rule added to the system (see below).
2. **Captions ran into the PERSON labels (still round).** 3-line caption pages. → Shorter pages, never more than 2 lines.
3. **"EVERYONE SEES IT" collided with A's role pill and glow rays (still round).** → Moved under A's floe, mirroring B's "NOBODY SEES IT".
4. **Safe-zone FAIL at 13.5–14.5 s (v04).** The payoff scale-push pushed B's iceberg into the right-side platform UI band. → Replaced with a vertical drift (doesn't widen the scene).
5. **Weak hook motion 0.27 → 0.34 (v04, v05).** Static wide opening. → Constant-speed pull-back 1.25× → 1.0× over the first 2 s (0.41).
6. **Static end 1.8 s (v04).** Push too slow. → Larger constant-speed drift; longest near-static stretch 0.2 s.
7. **False STT WARN (33/39 words) — a QC-tool bug.** STT sometimes writes spoken numbers as digits ("700", "120,000"). → `qc_episode.py` now normalises number words to digits on both sides, aligns sync on the matching words, and saves `stt_transcript.txt` / `stt_words.json`. The saved transcript is word-for-word correct.

## Remaining concerns / NOT verified
- **Audio measured, not listened to.**
- Average 8.8 < 9: mostly camera variety, facet look, hook punch and topic originality.
- References were not watched (counts + captions only; see research notes).
- ElevenLabs plan must allow commercial use (open item since DMM-003).
