# DMM-002 — quality-control report

**File:** `video/renders/daily/DMM-002/DMM-002_v03.mp4` · sha256 `5880db3083384d80a8055d3844c2f16eeab4d70765502a6620535dadc8547ab9`
**Status: NEEDS_FIXING (pending one human check).** Every technical, accuracy and rights check passes, and the production score is **8.5/10**, below the 9.0 target. The main gap is sound: it hasn't been heard by a person (see below).
**Renders:** v01 → v03 (3 rounds, plus 2 still rounds; earlier versions kept).

## Automated checks (`qc_v03/checks.txt`)
1080×1920 ✅ · 30 fps ✅ · 450 frames decoded ✅ (the container says 15.019 s because of AAC priming; the video stream is exactly 450 frames) · H.264 yuv420p bt709, AAC 320k ✅ · no decode errors ✅ · no black frames ✅ · no frozen stretch > 2.5 s ✅ · loudness −15.7 LUFS, true peak −1.5 dBFS, no clipping ✅

## Visual inspection (actually performed)
- **What I opened:** 11 beat frames at full resolution, 4 motion strips (hook, build, payoff and ending, sampled at 4 fps), a 10 fps strip of the headline swap, a contact sheet, and the safe-zone overlay stills.
- **Hook:** the note is mid-fall on frame 0 and lands at 0.23 s.
- **Layout:** all text sits inside the safe area, and the smallest text is 24 px. In the checked frames, nothing overlaps or clips.
- **Counter:** it always equals $20 × notes landed, because the counter, the picture and the audio share one model. It settles at exactly $7,300 on day 365.
- **Not verified:** I didn't watch it in real time and can't hear audio. The sound was checked by measurement and by construction: every slap is generated at the exact landing frame of its note.

## Fixed during QC
| Round | Problem | Fix |
|---|---|---|
| Stills 1 | Frame 0 had no visible motion; the column was too dark to read as a hook | Day 1 is mid-fall on frame 0; the glass visibility baseline was raised |
| Stills 1 | In the time-lapse, falling notes piled up above the glass mouth | Notes are clipped to the column interior and fade in at the mouth |
| Stills 1 | The signature crowded the "DAY 365" label | Moved it up |
| Stills 2 | The dense stream read as a smeared block | The stream is thinned at high drop rates |
| v01 | The payoff push-in carried the column behind the footnote | Re-framed the push; the column base stays above the footnote band |
| v02 | About 0.4 s with no headline during the ending swap | The incoming line now overlaps the outgoing one |

## Scores (1–10, a subjective production assessment, not a view prediction)
| Category | Score | Note |
|---|---|---|
| First 2-s hook | 8 | Mid-motion object + "$20 A DAY." on frame 0. Calm, ASMR-paced rather than a shock. |
| Cinematic quality | 8 | Lighting, depth, camera and motion blur are good. Code-drawn glass is less photoreal than footage. |
| Motion graphics | 9 | Physically timed drops, a growing light metaphor, a clean counter |
| Typography | 9 | |
| Pacing | 9 | Slow → accelerating → bloom → message, on the 0–2/2–6/6–12/12–15 grid |
| Sound design | 7 | Original and frame-synced, but **unheard** |
| Message clarity | 9 | |
| Emotional impact | 8 | |
| Originality | 9 | |
| Overall polish | 9 | |
| **Average** | **8.5** | Target 9.0 |

## To reach 9
1. **Listen once with sound.** If the slaps and bloom feel right, sound moves to 8–9 (average about 8.6–8.7). If not, a licensed premium track would replace the drone, keeping the synced note sounds.
2. **Cinematic quality:** add a subtle depth-of-field background layer (an out-of-focus room or desk silhouette, drawn or licensed) so the column sits in a place, not in a void.
3. **Hook:** make the first landing land harder (a slight camera shake plus a counter "tick" flash), so the first second has a punch.
