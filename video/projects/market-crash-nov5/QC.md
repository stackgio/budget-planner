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

---

# Polish pass — v08 (final) · `market-crash-nov5_v08_final-voice.mp4`

63.21 s · 1,896 frames · 1080×1920 · 30 fps · H.264 · original ElevenLabs voice untouched (183/183 words aligned). v06 is kept.

| Fix | Change | Verified |
|---|---|---|
| Election headline vs pill overlap (13–15 s) | "MIDTERM RESULTS" and the "DEMOCRATIC VICTORIES" pill now share one flex column (pill laid out below the headline's real height, 26 px gap); the pill enters from below its slot. Capitol drawing unchanged. | All 120 frames 360–479 (12.0–16.0 s) tiled and inspected: no overlap in entry, hold or exit; source credit and captions stay in their own space. |
| Opening progression (0–4 s) | Slow continuous push 1.035 → 1.055 (same peak as before) and "−1,421.5 POINTS IN ONE DAY" rolls in on "crushed", fading out before the question rises. | Frames 0–155 inspected; no stacking with "WHAT CAUSED THIS?". |
| Nvidia | Re-verified: −9.26% (−$18.53 to $181.60) per Investing.com, Yahoo Finance, MT Newswires → shown as −9.3%, the same one-decimal rounding as −5.5% / −4.4%. Graphic unchanged. | 35.9 s frame. |
| SoFi readability | Camera zoom into the real order card 1.32 → 2.1 (rows text ≈ 30 px on screen); everything above the card fades out while zoomed so the title stays legible. No pixels of the screenshot altered; all rows ("6 of 6", "$16.20", "$97.18", "Individual investing") remain visible. | 42.6–47.5 s frames. |
| Captions | No changes needed. | Every 0.5 s across the whole video: captions never collide with headlines, source labels, diagrams, charts or the screenshot. |

Unchanged: all other scenes, transitions, the scenario graphic and the final split-screen question.

---

# Final QC pass — v09 (final) · `market-crash-nov5_v09_final-voice.mp4`

63.21 s · 1,896 frames · 1080×1920 · 30 fps · H.264 · AAC · original ElevenLabs voice untouched. v08 is kept.

**Data (independent of the news articles):** FRED (St. Louis Fed) NASDAQCOM / SP500 daily closes and Yahoo Finance daily history.

| On screen | Close-to-close | Result |
|---|---|---|
| NASDAQ −5.5% | 25,736.51 → 24,315.00 = −5.523% | correct |
| −1,421.5 points | −1,421.51 | correct |
| S&P 500 −4.4% | 7,688.62 → 7,353.73 = −4.356% | correct |
| NVIDIA −9.3% | $200.13 → $181.60 = −9.259% | correct |

Resolves the earlier closing-level conflict: the Nasdaq closed at 24,315.00 (AP/MT Newswires); Schwab's 24,414.99 was the outlier. The level is still not shown on screen.

**Every frame (0–1895) tiled and inspected.** Fixed:
1. Frames ≈ 280–328: Damage-scene camera push lifted "NOV 5, 2026 · CLOSING MOVES" into the STACK WITH GIO watermark → push re-centred (y 1000 → 940) so the kicker stays at y ≈ 250. Verified frames 276–331.
2. Frames 240–249 and 1019–1027: S&P and Nvidia counters showed "−0.0%" before rolling → counters start on their reveal frame, and zero never carries a minus sign. Verified.
3. Frames ≈ 1302–1310 / 1388–1396: green screenshot background passed behind "I BOUGHT MORE SOFI" during the zoom → top crop engages at the start of the zoom. Verified.

**Sync:** 183/183 words aligned; all speech pauses in the rendered audio match the source file within 9 ms (the 12.36 s pause reads −55 ms only because the soft "paper" SFX plays in it). Captions are generated from the same word timings.
**SoFi screenshot:** byte-identical source (sha256 b0e8bcb11ba1…), no pixels altered; contains no account number, name or email, so nothing needs blurring; rows legible at the 2.1× zoom.
**Ending:** "WHAT DO YOU THINK?" visible frames 1717–1895; BUY THE DIP? / WAIT FOR LOWER? both on screen 1809–1895; last frame is the full split screen (0.9 s hold after "worse?", no blank frames).
