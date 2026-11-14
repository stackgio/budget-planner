# Daily Money Motion — production checklist (living document)

Every episode follows this list. **When a problem shows up twice, it gets a line here and, where possible, an automated check in `video/scripts/daily/qc_episode.py`.**

## A. Research (before any design)
- [ ] Use at least two sources. vidIQ is optional because its credits can run out. Free or alternative sources: Firecrawl web search, influencers-club play counts via Firecrawl, YouTube metadata via Firecrawl's youtube-com provider, and the verified library in `research/viral-references.json`.
- [ ] Label every observation **VERIFIED_FRAME / VERIFIED_COUNTS / AI_DESCRIPTION / ASSUMPTION**. Never write "watched" unless actual frames were inspected.
- [ ] Reject references whose success depends on real footage, physical action, a personal identity or third-party clips (DMM-002 lesson).
- [ ] `dmm.mjs check <ID>` and `dmm.mjs search <words>`: no repeated topic, hook, layout, metaphor or visual tag in the last 30 days.

## B. Script and hook
- [ ] One message. About 25–35 words, narration ≤ 12 s, leaving 2–3 s for a designed payoff.
- [ ] The hook is readable on frame 0 **and** there's meaningful motion in the first second.
- [ ] Every number lives in `facts.ts`, computed in code. Hypotheticals are labelled EXAMPLE. Returns are never guaranteed.

## C. Voice and audio (permanent default)
- [ ] Stack voice from `config.json → narrator`, via `voice_tts.py` (cached; never regenerate just to fix a mix).
- [ ] **No music.** SFX only, fixed gain, at least 20 dB below the voice during speech, ducked 6 dB. No impacts, no repetitive ticks.

## D. Picture
- [ ] A new metaphor and layout every episode: no reused trays, columns, split dashboards or pipes as the hero.
- [ ] Caption pages are 2 lines or fewer and never overlap the hero object at any camera zoom.
- [ ] No object draws on top of text (z-order). No graphic crosses another label.
- [ ] **The ending is designed:** after the voice ends there's a payoff with motion (a count, a reveal or a loop) and no near-static hold over 1.5 s.

## E. QC gate (run on the exported file)
- [ ] `render.sh` passes the hard export checks.
- [ ] `qc_episode.py <ID> <mp4> --stt` gives 0 FAIL. Each WARN is either fixed or explained.
- [ ] Look at: frame 0, 1 s, 2 s, every transition, the payoff, the last frame, the 4 motion strips and the contact sheet.
- [ ] Write the human-judgment scores honestly. **≥ 9.0 and 0 FAIL → READY FOR MY REVIEW; otherwise → NEEDS FIXING.**

## Recurring problems already seen (and what prevents them now)
| Problem | Seen in | Prevention |
|---|---|---|
| A label shows a final number before the animation reaches it | DMM-001 v01 | Values derive from the same model as the animation; QC beat frames at the payoff |
| Camera push moves text out of the safe area | DMM-001, DMM-002 | Push the scene layer only; **auto: safe-zone band check** |
| Hook phrasing too close to the reference | DMM-001 | Adaptation notes include a "phrases NOT used" line |
| A frame has nothing moving | DMM-002 v1 | **Auto: motion in the first 2 s** |
| Footnote or text crossing a graphic | DMM-002, DMM-003 | The z-order rule; check the payoff frame at full resolution |
| A static end hold | DMM-001, DMM-003 | **Auto: static-hold check (>1.5 s → WARN)** |
| Claimed to have "watched" a reference | DMM-001/002 research | Evidence levels in the library; wording rule above |
| Music and SFX competing with the voice | DMM-003 v02 | **Auto: SFX-under-voice ratio, no-music residual test, voice-untouched test** |
| A 3-line caption hits the hero object | DMM-003 v01 | Caption page breaks are set by hand; review at the narrowest moment |
