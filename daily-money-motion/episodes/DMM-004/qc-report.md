# DMM-004 — quality-control report

**File:** `video/renders/daily/DMM-004/DMM-004_v03.mp4` · sha256 `21dbb073ad21588b105229a4741b0f5ade9fc64c301529d39ea87ff7630ddee0`
**Gate: NEEDS FIXING.** Automated QC is 0 FAIL / 0 WARN (with speech-to-text), but the honest creative score is **8.75 / 10**, below the 9.0 gate.
**Renders:** v01 → v02 → v03 (3 of max 4), plus 2 still rounds. Only v03 is committed (v01/v02 are kept locally and git-ignored).
**Off-schedule:** one-time full production test requested by the creator for 2026-11-14 (the `due` gate was skipped on request).

## Automated QC on the final (`qc_episode.py DMM-004 DMM-004_v03.mp4 --stt`)
| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.1 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.9 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9998, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.5 dBFS RMS vs everything else -56.2 dBFS → 38.7 dB below (min 20) |
| audio | SFX peak | PASS | -28.2 dBFS (max -24) |
| audio | no background music | PASS | 47 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-18.2 1s:-16.1 2s:-20.3 3s:-17.6 4s:-17.1 5s:-17.1 6s:-17.1 7s:-19.5 8s:-45.1 9s:-66.1 10s:-80.5 11s:-62.6 12s:-54.4 13s:-47.1 14s:-56.5 |
| speech | intelligibility (STT) | PASS | 33/33 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.061 s |
| speech | STT audio events | PASS | ['[chime]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 27 distinct words OK |
| picture | frame 0 not blank | PASS | 2.50% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.61 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.9 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.727, 'DMM-002': 0.8, 'DMM-003': 0.845} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping (peak −4.9 dB). **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| Hook | 8.5 | Myth-correction hook ("doesn't cost you the small years") is strong, but frame 0 only shows its first half ("WAITING TEN YEARS TO INVEST"); the twist lands at 2–3.6 s |
| Script and accuracy | 9.0 | 33 words, one idea. "The last ten add more than the first thirty" is computed in `facts.ts` ($351K vs $305K) and asserted in code; EXAMPLE label + assumptions + "not guaranteed" on screen 0–15 s |
| Voice clarity and timing | 8.5 | 33/33 words recognised by STT; max sync error 0.061 s. The read is quick (7.6 s, ~4.3 words/s) with very short sentence gaps |
| SFX levels | 9.0 | 38.7 dB under the voice, peak −28.2 dBFS, no music (residual test passes) |
| Captions | 9.0 | Word-synced, ≤2 lines per page, key words in emerald, spelling clean |
| Visual quality | 8.5 | Clean, legible tree-ring cross-section; still a simple abstract on a dark stage |
| Transitions and camera | 8.5 | Keyed pull-back from 3× during growth, peel and regrow are smooth; no cuts by design |
| Layout and safe zones | 9.0 | Auto safe-zone check passes; text never overlaps the trunk |
| Payoff | 9.0 | Designed ending: outer 10 rings lift off (start at 35 = $305K), then grow back ring by ring with a live count to $656K; no static hold (longest 0.9 s) |
| Technical | 9.5 | All export, audio and decode checks pass |
| Originality | 8.5 | New metaphor and layout for the channel, but the 25-vs-35 framing is common on Instagram, and visual similarity to DMM-003 is 0.845 (limit 0.85) |
| Likely retention | 8.0 | The narration ends at 7.8 s; the second half is visual-only (SFX, no voice) |
| **Average** | **8.75** | |

## Corrections made (root cause → fix)
1. **Rings read as a grey blob (still round 1).** Each ring had its own random wobble phase, so neighbouring rings crossed. → One shared wobble whose phase drifts slowly with the ring index (rings always nest); higher band contrast (alternating dark bands).
2. **Age readout and "last 10 years" labels overlapped (still round 1, frame 162).** Their fade windows overlapped by design error. → Sequential windows (age out at end of "ring.", split labels in 7 frames later).
3. **Spelling FAIL "doesn" (v01).** Root cause in the QC tool, not the captions: the tokenizer stripped `'t` before the dictionary lookup, and the dictionary only knows "doesn't". → `qc_episode.py` now flags a word only if both the full contraction and its stem are unknown (no whitelist entry added).
4. **1.0 s near-static stretch and an empty top region after the last caption (v01).** The headline arrived 1 s after the caption left, and the regrow waited on it. → Headline at voEnd+22 frames, regrow at voEnd+76, ghost outline dash animates. Longest near-static stretch now 0.9 s.
5. **Bark rim off-centre, crossing the green rings (v02).** The rim used a different wobble seed (99) from the rings. → The rim's seed follows the outer ring index, so it nests exactly.

## Remaining concerns / NOT verified
- **Audio measured, not listened to.** Loudness, SFX ratio, no-music and STT were measured; nobody has listened to the mix.
- The narration pace is quick; a slower read would need a new TTS generation (not done: the rule is never to regenerate for a mix, and pacing is a creative call for you).
- Second half (7.8–15 s) has no voice; retention risk on platforms where people scroll on silence.
- Visual similarity to DMM-003 is 0.845, just under the 0.85 limit (shared dark stage + top captions).
- The reference's motion and sound were not seen (counts and caption only; see research notes).
- ElevenLabs plan must allow commercial use (same open item as DMM-003).
