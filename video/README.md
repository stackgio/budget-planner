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
- `components/LineChart.tsx`: SVG chart with gain/loss clipping against the cost basis, a cross-fading y-grid, year axis, camera push-ins, event markers and a live tip.
- `components/Header.tsx`: hook (visible on frame 0), later swapped for the closing question
- `components/Counter.tsx`: big value counter (single) or ranked rows (compare), plus date chip and % change
- `components/EventCallout.tsx`: editorial callout card placed beside the point, on the side not yet drawn
- `components/ResultCard.tsx`: verdict headline and up to 4 stats
- `components/Brand.tsx`: footnote (sources and assumptions) and subtle Stack With Gio wordmark
- `components/TickerBadge.tsx`: real logo from `public/logos/` when present, otherwise a ticker badge
- `theme.ts`: the design system (colours, type, platform safe zones)
