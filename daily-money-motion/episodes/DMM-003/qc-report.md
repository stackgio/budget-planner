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
