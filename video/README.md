# Stack With Gio — graph video engine

Remotion + TypeScript engine behind the `/graph` Claude Code command (`.claude/commands/graph.md`).
It turns verified historical price data into 1080×1920, 30 fps H.264 MP4 investing videos.

```
/graph $10,000 invested in GameStop in 2016
```

## Pipeline

| Step | Command | Output |
|---|---|---|
| Fetch / import prices | `python3 scripts/fetch_prices.py auto\|yahoo\|stooq\|firecrawl\|csv TICKER …` | `data/TICKER.json` (normalized, with warnings) |
| Compute investment math | `python3 scripts/compute.py projects/<slug>/scenario.json` | `calc.json` (series, facts, checks, assumptions, sources) |
| Creative plan → spec | `python3 scripts/build_spec.py projects/<slug>` | `spec.json` (all numbers resolved from tokens) |
| Render | `bash scripts/render.sh <slug>` | `out.mp4` |
| QC | `bash scripts/qc.sh <slug>` | `qc/` frames, contact sheet, frame plan, probe |
| Self-test | `bash scripts/selftest.sh [--full]` | synthetic lump / compare / DCA stills |
| Preview | `npm run studio` | Remotion Studio (placeholder = synthetic test data) |

Python scripts use only the standard library. Node 18+ and ffmpeg are required.
If Remotion can't download its own headless browser, set `REMOTION_BROWSER_EXECUTABLE`.

## Price conventions

- `close` is the split-adjusted daily close. Lump-sum and DCA math use it, so splits and reverse splits are exact.
- `dividends: "reinvest"` buys more shares at each ex-date close. It is cross-checked against the provider's adjusted-close total return.
- `start_price_unadjusted` and `shares_bought_original_units` give the as-traded figures for honest copy, e.g. "GME was $28.31 a share in Jan 2016".
- Intraday highs are reported separately and are never drawn as closes.

## Story tokens (`story.json`)

`{TICKER.fact:format}` or `{TICKER@YYYY-MM-DD.close|value|contributed|gain_pct:format}`

Formats: `money money2 compact price pct pctabs x date month year shares num num1 int`.
Literal `$`, `%` or `x` numbers that aren't scenario inputs are flagged `UNVERIFIED` by `build_spec.py`.

## Components (`src/`)

- `GraphVideo.tsx`: composition (one per video, driven by `spec.json`)
- `lib/timeline.ts`: maps each frame to a fractional data index, with event slow-motion, holds, end easing and a smoothed y-domain. Every visual reads from it, so the line and counter stay in sync.
- `components/LineChart.tsx`: SVG chart with the signature bold black L-shaped axes, gain/loss clipping against the cost basis, a cross-fading y-grid, year axis, camera push-ins, event markers and a live tip.
- `components/TipTags.tsx`: value and "Invested $X" pills that ride the line's tip, fading out during callouts
- `components/Header.tsx`: hook (visible on frame 0), later swapped for the closing question
- `components/Counter.tsx`: big value counter (single) or ranked rows (compare), plus date chip, % change and the optional AGE clock (`age.start` in the story)
- `components/EventCallout.tsx`: editorial callout card placed beside the point, on the side not yet drawn
- `components/ResultCard.tsx`: verdict headline and up to 4 stats
- `components/Brand.tsx`: footnote (sources and assumptions) and subtle Stack With Gio wordmark
- `components/TickerBadge.tsx`: real logo from `public/logos/` when present, otherwise a ticker badge
- `theme.ts`: the design system (colours, type, platform safe zones)

---

# Story videos (V4): editorial · cinematic · Marcus

A second engine for narrated explainers, living alongside the graph engine. It shares `theme.ts`, the Inter fonts, the brand mark and the L-shaped axes.

```
bash scripts/render-story.sh                          # temp timing, no voice
bash scripts/render-story.sh public/voice/<slug>/props.json   # with narration
```
Output: `out/<slug>.mp4` plus `out/<slug>-qc/`, with a frame from every scene beat, a contact sheet, probe and decode checks, and the narration source.

## Looks
| Look | Use for | Palette |
|---|---|---|
| `editorial` | explaining, lists, decisions | cream paper `#F5F0E6`, ink, green `#1E9E57` |
| `cinematic` | effort, drama, data and charts | matte black `#0B0C0E`, lamp light, green `#2CD47A` |
| Marcus | both looks | white stickman with a black outline and a backward black cap. Never restyle him. |

## Narration → timing (`src/story/lib/narration.ts`)
Write the script as lines with ids (`script.ts`). Scenes and animations never hard-code seconds. They ask for cues such as `cue('L3', 'car')` through `useCues()`. Timing sources, best first:
1. **aligned**: word timestamps for real audio. Use `python3 scripts/voice.py tts <slug> --voice <id>` (ElevenLabs TTS with timestamps) or `voice.py align <slug> take.mp3` (ElevenLabs forced alignment of your own recording). Both need `ELEVENLABS_API_KEY`.
2. **audio-scaled**: `voice.py copy <slug> take.mp3`. Estimated timing is stretched to the audio length. This is approximate, not final sync.
3. **temp**: no audio. Syllable-weighted estimates at about 165 wpm × `tempRate`. These are placeholders only.

`buildSceneWindows()` (`lib/sceneTimeline.ts`) turns cues into `<TransitionSeries>` durations. New audio re-times every scene automatically.

## Components (`src/story/components/`)
| Component | What it does |
|---|---|
| `Marcus` | FK rig: 18 poses, 9 faces, spring-blended `track` keys with overlapping action, `walk/type/cheer/breathe-hard` cycles, blinks, auto-grounding, hand props. QC sheet: `MarcusGallery` composition. |
| `CreditCard` | generic card (`debt`/`offer`/`green`), 3D tilt, shine sweep, live balance slot |
| `Money` | `Bill`, `Coin`, `CashStack`, `Wallet` (opens), `Receipt` (prints lines, PAID stamp), `SavingsJar` (fill level) |
| `ProgressBar` | financial progress with milestones and a knob |
| `DebtMeter` | 240° payoff gauge; the counter shows what's left, the arc shows what's paid |
| `StoryGraph` | animated multi-series line graph (payoff and growth) with bold L axes, end labels and markers |
| `NumberCounter` | odometer digits; leading digits collapse smoothly |
| `KineticText` | `rise`/`pop`/`slam`, per-word colours, marker sweep, masked exits |
| `Transitions` | `iris` (light from a point), `panelSweep` (chapter or "paid off"), `matchCut`; plus the built-in `slide`/`wipe` |
| `Comparison` | A-vs-B panels for financial comparisons |
| `Camera` | keyed framings with eased moves, optional handheld drift, shake |
| `Captions` | word-synced captions in the band above the platform UI; follow the scene palette |
| `Chrome` | `ChapterTag`, `BrandBug`, `Sfx` |
| `Backgrounds` | `EditorialBg`, `CinematicBg` (key light, floor, vignette, grain) |

Motion presets live in `lib/motion.ts`: springs `snappy/bouncy/heavy/smooth/limb`, `kf`, `prog`, `arc` (objects travel in arcs), `shake`, `wobble`.

## Sound
`python3 scripts/make_sfx.py` synthesises the SFX kit (`public/sfx/*.wav`: whoosh, pop, coin, cash, card, paper, thud, stamp, chime, tick, click). It's all original, peaks around -9 dBFS, and is meant to sit under the voice. No music is included. Add licensed music at publishing.

## New video checklist
1. Copy `src/videos/debt-three-things/` and rewrite `script.ts`: lines, `SCENES` (first line plus the transition in) and `TAIL_SEC`.
2. One component per scene. Every animation is keyed to a `cue()`. Ask "what does the viewer learn or feel?" and cut anything that doesn't answer it.
3. Keep content above y=1390 (captions band) and inside `story.safe`. Keep Marcus's scale between about 0.9 and 1.15.
4. Register the composition in `src/StoryRoot.tsx`. Add QC beats in `scripts/story-report.ts`.
5. Render, open the contact sheet and every scene frame, fix, then re-render.

---

# /motion — universal video command (Editorial Motion)

`/motion <idea | script | voiceover path | screenshots>` (skill: `.claude/skills/motion/`) classifies the request into one of 7 modes, writes or keeps the script, storyboards it, builds a narrated video on the story system, renders it, and runs QC. Historical-graph data goes through the `/graph` pipeline.

| Step | Command |
|---|---|
| Scaffold a video | `node scripts/motion/new-video.mjs <slug> <CompId> <mode> "<title>"` → `src/videos/<slug>/` (script, facts, scenes, qc) + registration in `StoryRoot.tsx` |
| Ingest voiceover (byte-identical) | `python3 scripts/voice.py ingest <slug> voice.mp3` |
| Word timestamps | `voice.py transcribe <slug>` (ElevenLabs Scribe or local Whisper) · `voice.py align <slug>` (forced alignment) · `voice.py diff <slug>` (script vs spoken) |
| Render + QC | `bash scripts/motion/render.sh <slug> [public/voice/<slug>/props.json] [--stills-only]` → `renders/<slug>/<slug>_vNN_<final-voice\|voice-approx\|temp-timing>.mp4` + `qc_vNN/` |
| Pipeline self-test | `bash scripts/motion/selftest.sh` (scaffold → ingest → stills → cleanup) |

Shared pieces: `src/story/lib/NarratedVideo.tsx` (generic narrated shell: cues, transitions, captions, untouched voice, never shorter than the voice), `src/story/lib/meta.ts` (`META` for variety, `fact()` provenance), `src/story/components/Screenshot.tsx` (real evidence: zoom, highlight, blur redaction), `src/story/components/AllocationBar.tsx` (paycheck/budget split).
