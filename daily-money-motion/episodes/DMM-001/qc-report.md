# DMM-001 — quality-control report

**File:** `video/renders/daily/DMM-001/DMM-001_v04.mp4` · sha256 `adfa4c8fd866711044061b5a78a97352db95626b00155933c37e9e54b0fab3af`
**Status: NEEDS_FIXING.** Every technical, accuracy and rights check passes, but the creative score is 8.4/10, below the 9.0 target (see "To reach 9"). It is publishable if you accept it as is; that's your decision.
**Renders:** v01 → v04 (4 QC rounds; earlier versions kept, none overwritten).

## Automated checks (`qc_v04/checks.txt`)
| Check | Result |
|---|---|
| Resolution | 1080×1920 ✅ |
| Frame rate | 30 fps ✅ |
| Frames | 450 decoded ✅ (container reports 15.019 s because of AAC priming; the video stream is exactly 450 frames) |
| Codec | H.264 yuv420p bt709, AAC 320k ✅ |
| Decode errors | none ✅ |
| Black/blank frames (blackdetect) | none ✅ |
| Frozen > 2.5 s (freezedetect) | none ✅ |
| Loudness | −16.0 LUFS integrated, true-peak ≈ −3.9 dBFS, no clipping ✅ |

## Visual inspection (actually performed)
I opened and checked 10 beat frames at full resolution (0 s, 1 s, 2 s, 2.5 s, 4.1 s, 7 s, 10.5 s, 12.3 s, 13.8 s, last), 4 motion strips (hook, build, payoff and ending, sampled at 4 fps) and a 10-frame contact sheet. I also viewed frames with the safe-zone overlay (stills).
- The hook is readable on frame 0. Motion starts by frame 5 (0.17 s).
- All text sits inside the safe area (top 170, right 120, bottom 330). The smallest text is 24 px. No clipping or overlaps in the checked frames.
- Every on-screen number was checked against `facts.ts`, and mid-animation values were checked for consistency (e.g. year 5.4: spent $32,542 and worth $39,444 both correspond to month 65).
- The header swap shows no flashes or jumps between the sampled frames.
- **Not verified:** I did not watch the video in real time and cannot listen to the audio. The sound was checked by measurement only (levels, clipping, the timing of the events in code). Watch it once with sound before posting.

## Fixed during QC
| Round | Problem | Fix |
|---|---|---|
| 1 (stills) | The growth pill showed the final +$26,542 at year 9, while WORTH still read $79,478 | The pill now lands only when the value settles (year 10) |
| 1 | A global camera push moved the headline above the safe top (≈155 px) | Replaced by a lift on panel 2 only |
| 1 | The "PUT IN" label was crossed by the dashed line | Moved to the middle of the line |
| 2 (v01) | Nothing moved for the first 0.6 s | Allocation starts at frame 5 |
| 2 | The hook "SAME $500 RAISE. TWO MOVES." echoed the reference's distinctive phrasing | Rewritten as the original question hook |
| 2 | Audio too quiet (mean −32 dB) | Rebalanced to −16 LUFS |
| 3 (v02) | The growth pill sat on top of the curve | Moved beside the WORTH counter |
| 4 (v03) | "PUT IN $60,000" appeared at year 5, when only $30k had been put in | Shown only at year 10 |

## Scores (1–10, honest; not a prediction of views)
| Category | Score | Note |
|---|---|---|
| Hook strength | 8 | A clear question plus an instant A/B split. There's no striking image in the first frame. |
| Visual quality | 8 | Clean and premium, but panel-heavy. |
| Editing sophistication | 7 | One continuous frame with restrained moves. Could use one bold transformation. |
| Pacing | 8 | The build (2–6 s) is mostly counters climbing. |
| Text readability | 9 | |
| Sound design | 7 | Original synthesized bed, measured but not heard. |
| Financial accuracy | 9 | The math is exact and the assumptions are on screen. Fees, taxes and inflation are not modelled (disclosed as hypothetical). |
| Brand consistency | 9 | |
| Originality | 9 | |
| Mobile viewing | 10 | |
| **Average** | **8.4** | Target 9.0 |

## To reach 9 (recommended before scaling)
1. **Hook image:** in the first 0.5 s, the "+$500" chip should physically split into the two panels (a continuity move), instead of both chips already being in place.
2. **Second hook at about 5 s:** a brief "YEAR 5 — $30,000 GONE" stamp on panel 1. That gives the build a turning point.
3. **Sound:** replace or upgrade the synthesized bed with a licensed premium track (record the licence in the manifest), or have a human approve the current bed by ear.
4. **Optional realism line:** an "after a 0.2% fee" variant, to show we model costs.
