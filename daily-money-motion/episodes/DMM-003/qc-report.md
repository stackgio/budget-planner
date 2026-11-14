# DMM-003 — quality-control report

**File:** `video/renders/daily/DMM-003/DMM-003_v02.mp4` · sha256 `efc6643d37717090b5c2e8696321a0d267192096d99351aec2bf78e04352a833`
**Status: NEEDS_FIXING (awaiting your approval).**
- Every technical, sync, intelligibility and accuracy check passes.
- The production score is **8.3/10**, below the 9.0 target (see "To reach 9").
- One rights item needs your confirmation: your ElevenLabs plan must allow commercial use.

**Renders:** v01 → v02, plus 3 still rounds. Both versions are kept.

## Automated checks (`qc_v02/checks.txt`)
- **Format:** 1080×1920 ✅ · 30 fps ✅ · 450 frames decoded ✅ · H.264 yuv420p, AAC 320k ✅
- **Picture:** no decode errors ✅ · no black frames ✅ · no frozen stretch > 2.5 s ✅
- **Loudness:** −17.6 LUFS integrated, true peak −4.3 dBFS, no clipping ✅

## Audio, measured (I can't listen; these are objective tests, not a listening review)
| Test | Result |
|---|---|
| Narration source | ElevenLabs TTS, your "Stack voice " (`xwJCF4OpyrvnHPQlIyZD`); cached under key `4f523e46c7ab92be47ec` (re-renders cost no API call) |
| Narration length | 9.87 s, 31 words (about 3.2 words/s, natural); within 15 s with room for the ending |
| **Intelligibility in the final mix** | The final MP4's audio went through ElevenLabs speech-to-text: **31/31 words recognised exactly** (match ratio 1.0). The only non-speech tag was "[gentle music]". |
| **Sync** | Speech-to-text word starts vs the planned word frames: mean +0.03 s, max 0.09 s (within the speech-to-text's own precision) |
| Voice untouched | The MP3 plays as delivered by the API on its own track (not re-mixed into the bed) |
| Music | Original synthesized pad + pluck pulse; ducked under the voice; lifts after the last word |

## Visual inspection (actually performed)
- **What I opened:** 10 beat frames at full resolution, 4 motion strips (hook, build, payoff and ending, at 4 fps), a 5-frame still round after each fix, and the safe-zone overlay stills.

### Fixed during QC
| Round | Problem | Fix |
|---|---|---|
| Stills 1 | Captions overlapped the paycheck chip during the camera push | Tower lowered; push reduced |
| Stills 1 | The phase-1 savings tray showed a green puddle while the label said $0 | Savings stays truly empty until the flip |
| Stills 1 | Savings swung off-screen during the flip | Arc reduced |
| Stills 1 | Little motion in the first second | The tower assembles from frame 0 |
| Stills 2 | Frame 0 cluttered by trays mid-air | Lower trays fade in as they land |
| v01 | The pour stream cut through the "$3,000" on the paycheck chip | Chip on one line, drawn above the stream |
| v01 | A 3-line caption hit the chip | That page was split in two |
| v01 | Labels overlapped mid-flip | Labels fade while trays swap |

### Checked
- **Safe areas:** all text sits inside them; the smallest text is 24 px.
- **Captions:** each word lights up on its spoken frame, and key words turn emerald (SAVING, LAST, NOTHING, FLIP, SAVINGS, FIRST).
- **Numbers:** $3,000 → $300 (10%) → $3,600/yr matches facts.ts.

### Not verified
I didn't watch it in real time and can't judge the voice's tone or feel. The measured tests above show it's clear and in sync, not that it sounds like you.

## Scores (1–10, a subjective production assessment)
| Category | Score | Note |
|---|---|---|
| First 2-s hook | 8 | Reassuring reframe + caption readable on frame 0 + the tower assembling. No striking image. |
| Cinematic quality | 7 | A clean motion-graphic illustration, not cinematic |
| Motion graphics | 8 | Pour/overflow physics read well; the flip is the signature move |
| Typography | 9 | Word-synced karaoke captions, clear hierarchy |
| Pacing | 8 | Tight while the voice runs; the last ~2.5 s are a static hold |
| Sound design | 8 | Voice clarity verified by speech-to-text; mix not heard by a person |
| Message clarity | 10 | |
| Emotional impact | 7 | |
| Originality | 8 | |
| Overall polish | 8 | |
| **Average** | **8.1** | Target 9.0 |

## To reach 9
1. **The ending:** use the 12–15 s hold for motion. The trays could empty and refill (the next payday) so the video loops seamlessly into frame 0, or the $3,600 could count up.
2. **Hook image:** open on the dry SAVINGS tray close-up with "$0" (the problem first), then pull back to the tower.
3. **Voice check:** listen once. If the delivery feels flat, we can raise the voice's "style" setting slightly. That's one cached regeneration.
4. **Rights:** confirm your ElevenLabs plan includes commercial use.

---

# v03 — audio-only revision (2026-11-14)

**File:** `video/renders/daily/DMM-003/DMM-003_v03.mp4` · sha256 `78f8c71e756867e5ac9b64621baa24942ea0f2d902e9bc9e8f11992b691ce5df` · 1080×1920 · 30 fps · 450 frames · all hard checks pass.
**Requested by the creator:** remove the music, cut the effects by 10–15 dB, keep the voice untouched.

## What changed
| | v02 | v03 |
|---|---|---|
| Background music (pad, pluck pulse) | yes | **removed entirely** |
| Kept effects (pour, trickle, last drip, flip air, tray settle, savings chime) | v02 level | **about −13 dB**, plus **−6 dB more under the narration**, softer attacks |
| Removed effects | — | 4 tower-assembly tinks (repetitive), the end-card low "boom" (startling), a second chime partial, the final tink |
| Gain staging | peak-normalised | fixed gain (normalising would have pushed quiet effects back up) |
| Narration | Stack voice MP3 | **the same file**: sha256 `ab7eab859b1e4519…`, no regeneration, **0 ElevenLabs credits** |
| Visuals | — | **bit-identical to v02** (whole-video picture comparison: PSNR = ∞) |

## Audio measured across the whole video (not listened to: I can't hear audio)
- **Narration in the mix:** correlation with the original file 0.9998, level −0.01 dB vs the original. No compression or limiting applied.
- **Effects vs voice during narration:** voice −17.4 dBFS RMS vs everything else −51.1 dBFS → **33.7 dB below the voice**. The effects track peaks at −33.5 dBFS.
- **No music:**
  - The non-voice residual is −58.7 dBFS before the first pour (v02 had −24.8 dBFS of music there).
  - It is **digital silence (−240 dBFS) from 10.6 s to the end** (v02 had −17.9 dBFS).
- **Per-second level, v03 (dBFS RMS):** 0:−16 1:−18 2:−19 3:−17 4:−17 5:−19 6:−16 7:−18 8:−18 9:−18 · then silence from 10.6 s.
- **Loudness:** −17.7 LUFS integrated, true peak −5.1 dBFS, no clipping.
- **Speech-to-text on the final mix:** **31/31 words recognised**; **no audio events detected** (v02 was tagged "[gentle music]").

## Honest caveats
- **I have not listened to this mix.** The measurements show the effects are far below the voice. At 34 dB under it they may be barely perceptible on phone speakers. If you want them a touch more present, +6 dB is a one-line change (`SFX_TRIM` in `make_dmm003_sfx.py`); the visuals don't change.
- **The last ~4.4 s have no audio.** That's intentional (no music; you add it per platform), but the video is silent there if posted as-is.
- **The score is unchanged at 8.1/10** (audio fix only; the creative notes above still apply).

---

# v04 — creative fixes under the permanent QC standard (2026-11-14)

**File:** `video/renders/daily/DMM-003/DMM-003_v04.mp4` · sha256 `17a5287d1eb7f4c143a0a73f70e7c765c7cedd08425808d9fc1cc1d23543b33f` · 1080×1920 · 30 fps · 450 frames (15.00 s) · Stack voice narration (unchanged file) · SFX only, no music.
**Label: NEEDS FIXING** (`dmm.mjs gate`: creative score 8.4 < 9.0; automated QC 0 FAIL / 0 WARN).

## Root causes found by the new automated QC on v03, and the fixes
| Finding (measured) | Root cause | Fix in v04 | Result |
|---|---|---|---|
| Motion in first 2 s **0.33** (WARN) | The tower finished assembling at 0.6 s; nothing else moved until the pour at 2.3 s | Assembly spread over the first line (savings tray lands on the word "saving"); the camera opens at 1.14× and pulls back to 1.0× | **0.44 (PASS)** |
| Static hold **11.5–15.0 s (3.5 s)** (WARN) | Nothing was designed for after the narration ends at 10.1 s | A month-by-month count-up $300 → $3,600 with 12 dots (11.0–12.8 s), then "every payday": the paycheck pours again through the whole tower to the last frame (a matching soft pour, same subtle SFX level); slow 1.03× push | **1.2 s max (PASS)** |

## Automated QC (`renders/daily/DMM-003/qc_auto_DMM-003_v04/QC_AUTO.md`)
All 22 checks pass:
- **Export:** 1080×1920, 30 fps, 450 frames, h264/yuv420p, audio present.
- **Loudness:** −17.7 LUFS, true peak −5.1 dBFS.
- **Voice:** untouched (correlation 0.9998, −0.01 dB).
- **SFX:** 33.7 dB under the voice; SFX peak −33.3 dBFS; no music.
- **Speech-to-text:** 31/31 words, max sync error 0.085 s, no audio events.
- **Captions:** match the narration and are correctly spelled.
- **Picture:** frame 0 has text; no abrupt jumps; safe-zone bands clear.
- **Similarity:** to DMM-001 0.735, to DMM-002 0.826 (limit 0.85).

## Human judgment (my assessment; not verified by listening; not a view prediction)
| Category | Score | Note |
|---|---|---|
| Hook (0–2 s) | 8 | Strong reassuring line, readable on frame 0, and the build now moves. Still no striking image. |
| Script and accuracy | 9 | One message, natural; the math is exact and labelled EXAMPLE |
| Voice clarity and timing | 9 | Measured: 31/31 recognised, 0.085 s max sync error. Your judgment of the delivery is still needed. |
| SFX levels | 8 | 33.7 dB under the voice; may now be barely audible on phones |
| Captions | 9 | Word-synced, two lines or fewer, key words in green |
| Visual quality | 7.5 | Clean and on-brand, but an illustration rather than cinematic |
| Transitions and camera | 8 | The flip is the signature move; the camera is restrained |
| Layout and safe zones | 9 | |
| Final payoff | 8.5 | The count-up plus the payday loop make a real ending now |
| Technical | 10 | |
| Originality | 7.5 | The second "glass" metaphor in a row (DMM-002 column → DMM-003 trays) |
| Likely retention | 8 | Fast and clear; the visual novelty is moderate |
| **Average** | **8.4** | Gate 9.0 → **NEEDS FIXING** |

**Why it isn't a 9, honestly:** the remaining gap is the concept's visual ceiling (illustrative trays, repeated glass language), not a fixable defect. More tweaks won't get it to 9; the next episode needs a stronger, non-glass visual idea from the start. The checklist now enforces that through the metaphor/visual-tag repetition check.
