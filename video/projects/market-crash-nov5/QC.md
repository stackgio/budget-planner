# QC — market-crash-nov5 v06 (final)

File: `video/renders/market-crash-nov5/market-crash-nov5_v06_final-voice.mp4` · 63.21 s · 1,896 frames · 1080×1920 · 30 fps · H.264 yuv420p · AAC
Frames inspected: contact sheets v04–v06, full-size beat frames (`qc_v06/`), motion strips of 0–2 s and 36–38.5 s from the final MP4.

| Check | Result |
|---|---|
| Build / export | `tsc` clean; render.sh checks all OK (1080×1920, 30 fps, h264, decode clean). |
| First-second hook | Frame 0: "NASDAQ −5.5%" in 260 px red, date kicker and source credit readable; red bar grows on the shared scale over the first second; push-in + small impact. "WHAT CAUSED THIS?" lands on "what" (3.64 s). |
| Pacing | 10 scenes, cuts every 4.1–9.0 s, motion beats every 1–3 s keyed to words. No added pauses; the brief's 51 s plan was re-timed to the real 62.7 s narration. |
| Audio sync | ElevenLabs Scribe word timestamps: 183/183 words matched, 0 mismatches. Voice file played untouched at 1.0× (sha256 a504bd33…); video 63.21 s ≥ voice 62.67 s; last word "worse?" ends 62.30 s and the debate screen holds to the last frame. Mix peak −5.8 dBFS (no clipping); SFX at 0.18–0.32 under the voice. |
| Captions | Word-synced, ≤ 4 words / 2 lines, band from y = 1430; source labels at y ≈ 1318–1376 above the band; nothing overlaps the transaction rows (screenshot masked above y ≈ 1396). |
| Legibility | No text under 24 px; content within safe margins (left 72, right 120, top 170); fixed during QC: pipeline label collision (v04), plan badge vs "FALLS FURTHER", debate headline vs panels, VS badge vs "WAIT", scenario label vs headline (v05). |
| Screenshot authenticity | Creator's PNG copied byte-identical (sha256 b0e8bcb11ba1…); shown in a phone frame with camera push + green outline only. No pixels altered. Nothing blurred because it contains no account number, name or email. No date on the screenshot, so no date is claimed. |
| Financial accuracy | Nasdaq −5.5 (5.52), S&P −4.4 (4.36), Nvidia −9.3 (9.26) — each from ≥ 2 sources (see SOURCES.md). Bars share one 0…−10 % scale. Election framed as "one major concern" with footnote of other reported causes; regulation labelled "POSSIBLE SCENARIO · NOT ENACTED"; no dollar total for AI spending; scenario paths labelled "SCENARIOS — NOT PREDICTIONS" and "ILLUSTRATION · NOT REAL DATA"; SoFi labelled "PERSONAL DECISION · NOT A RECOMMENDATION"; ending "NOT FINANCIAL ADVICE". |
| Brand | STACK WITH GIO watermark on every frame (top-left, 62 %); no logo intro/outro; no third-party logos (NVIDIA set in plain type). |

Known minor items (not blocking):
- Pivot scene: caption highlight is green during the ~1.3 s "panic selling" phrase (caption colour follows the scene's palette, which is green for the decision beat).
- Hook lower half is empty until "WHAT CAUSED THIS?" at 3.6 s (by design, keeps the frame-0 number dominant).
