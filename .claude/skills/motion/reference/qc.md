# Quality control and delivery

`bash scripts/motion/render.sh <slug> [props.json]` writes `renders/<slug>/qc_vNN/`:
`checks.txt` (export, audio, duration, decode), `timing.txt` (narration source, scene windows, alignment mismatches), `report.json`, `probe.txt`, one PNG per beat (`a_frame0`, `a_1s`, `a_2s`, every scene transition and midpoint, every line start, your `qc.ts` beats, `z_last`), and `contact_sheet.png`.

**Open `contact_sheet.png` and every beat PNG with Read.** Check each item below and write down what failed. Fix, re-render (it versions to `vNN+1`), and repeat for up to 3 rounds. Then list anything unresolved in the delivery.

## Checklist
1. **Build:** `npx tsc --noEmit` is clean. `checks.txt` shows all OK: 1080×1920, 30 fps, h264, decode clean.
2. **Hook:** `a_frame0` has the hook readable, with no blank or half-animated frame. There's visible motion or change by `a_1s`/`a_2s`, and a second hook (new visual, twist or consequence) between 3 and 7 s.
3. **Every scene:** each frame says one thing, with ≤ 6 words of on-screen text besides captions. Nothing is crowded and nothing looks like a slideshow.
4. **Typography and mobile:** nothing under 24 px. No clipping or overlaps. Content stays inside `story.safe` (top 170, right 120, bottom 330) and above y=1390. The captions band is clear of scene content.
5. **Marcus:** he looks exactly like the rig (white body, black outline, backward black cap), with no stretched limbs, floating feet or wrong scale (0.9–1.15). He uses `onDark` on dark scenes. His poses read clearly and match the narration.
6. **Continuity:** objects that travel between scenes line up at the cut. Transitions are meaningful and never the same one twice in a row. No jumps or flashes between neighbouring contact-sheet frames.
7. **Financial accuracy:** every on-screen number equals its `facts.ts`/`calc.json` value. Counters have **settled** to the exact value in the frame after the spoken amount (a rolling odometer mid-frame isn't an error, but the settled value must be right). Totals add up. Percentages and APR math have been re-checked with a quick `python3 -c` or `npx tsx -e`. Hypothetical figures show "EXAMPLE". Historical claims have their assumptions footnoted.
8. **Authenticity:** screenshots are unaltered apart from framing, zoom and highlight, and sensitive info is blurred. No fabricated UI, balances or logos.
9. **Audio** (if a voice was supplied): `checks.txt` shows an audio stream, video ≥ voice duration, and the voice sha256. `timing.txt` shows `narration aligned` with **0 mismatches** for final sync. Each number frame (`c_*` beats) appears as the amount is spoken. SFX are under the voice. `max_volume` < −0.5 dB (no clipping).
10. **Ending:** a satisfying takeaway and a natural CTA (if any). The brand is subtle. The tail isn't longer than needed.
11. **Variety:** compared with the last 3 videos' `META`, at least three of the variety dimensions in `style.md` are different.

Optional: watch motion between beats with `ffmpeg -ss <t> -t 2 -i <mp4> -vf fps=6,scale=270:-1,tile=6x2 <png>`, then open the PNG.

## Delivery report (keep it short)
```
**MP4:** video/renders/<slug>/<slug>_vNN_<tag>.mp4 · 34.2 s · composition <CompId> · mode <mode>
**Narration:** final (aligned to your ElevenLabs voice, 0 mismatches) | approximate (…) | temporary (…)
**Hook:** "…"
**Timeline:** 0.0s hook … / 3.4s … / 11.8s … / 24.0s … / 31.0s ending
**Numbers:** example figures (labelled) … | your figures from <screenshot> … | data <source, dates, dividends, nominal>
**Script vs voice:** none | "money" → spoken "cash" (L2)
**Remaining issues:** None | …
Re-render with final voice: python3 scripts/voice.py ingest <slug> <file> && python3 scripts/voice.py transcribe <slug> && bash scripts/motion/render.sh <slug> public/voice/<slug>/props.json
```
