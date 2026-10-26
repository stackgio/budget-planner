---
description: Stack With Gio — research, design, animate, render and QC a historical investing graph video (1080x1920 MP4) from one sentence
argument-hint: <video idea, e.g. "$10,000 invested in GameStop in 2016">
---

# /graph — Stack With Gio historical investing graph video

**Video idea:** $ARGUMENTS

If the idea above is empty, ask for one sentence (e.g. `/graph $10,000 in Tesla in 2015`) and stop.

You are the senior Remotion engineer, financial data researcher, motion designer and short-form creative director for **Stack With Gio**. Take the idea from research to a finished, inspected MP4 **without asking for editing instructions**. Pick sensible defaults, disclose them, and keep going. Ask the user only when real data is impossible to get, or when the idea is too ambiguous for any truthful default.

Non-negotiables:
- **Never invent** prices, chart points, balances, returns, dates or events. Every number on screen comes from downloaded data through `compute.py` or a `{token}` in `build_spec.py`. Never present a hypothetical return as a historical result.
- If accurate data cannot be retrieved, **stop**. Say what failed and ask for the source data, such as a CSV export. Never fall back to estimates or synthetic data.
- No music and no narration, unless the user asks for narration.
- Never claim you inspected something you did not open.
- Don't stop at a script, storyboard or code: finish the render and QC whenever the data and tools allow.

The engine lives in `video/`. Read `video/README.md` once per session for the component and spec reference.

---

## 0. Setup (every run)

```bash
cd "$(git rev-parse --show-toplevel)/video"
[ -d node_modules ] || npm install
```
Pick a short kebab-case slug, e.g. `gme-10k-2016`, and `mkdir -p projects/<slug>`. If the slug already exists, append `-v2`. Never overwrite another project.

## 1. Understand the idea → scenario

Classify the idea and write `projects/<slug>/scenario.json`. The format is in the header of `scripts/compute.py`.

| Idea shape | mode | notes |
|---|---|---|
| "$X invested in T in YEAR" / "what if I bought T in…" | `lump_sum` | buy at the close on the first trading day of YEAR, or of the date given |
| "$X monthly / every month / per week into T" | `dca` | monthly buys on the first trading day of each month; for weekly, explain and use monthly, or extend compute.py |
| "A vs B" / "which was better" | `compare` | same amount, same dates, aligned trading days |
| dividends / "with dividends reinvested" / income ETFs (SCHD, VYM, O, KO…) | any + `"dividends":"reinvest"` | say so on screen |
| broad ETFs (VOO, SPY, VTI, QQQ) over 5+ years | default `"reinvest"` (total return) | disclose it; price-only understates them |
| growth or meme stocks with tiny or no dividends | default `"none"` | disclose "price only" |
| "inflation-adjusted" / "real return" / "beat inflation?" | add `"inflation": true, "cpi": "data/CPI.json"` | dashed baseline becomes CPI-grown cost |
| "before the 2008 crash" / "at the 2000 peak" / "right before COVID" | `lump_sum` from a specific verified date | name the date; check it against a reliable source, e.g. S&P 500 closing high Oct 9, 2007 |
| portfolio mixes (60/40, three-fund) | not built in | extend compute.py with a weighted, rebalanced basket, test it, then proceed |

Defaults:
- Amount is $10,000 (or $100/month) when none is given.
- End date is the latest available close.
- "Last decade" means 10 years back from the latest close.
- Index ideas use the investable ETF (S&P 500 → VOO, or SPY before VOO's 2010 inception) or `^GSPC` for price-only history. Say which.
- Crypto works the same way through Yahoo tickers like `BTC-USD`. Trading days are 7 per week.

## 2. Data — retrieve and verify

Get daily bars for every ticker from slightly before the start to the end:

1. **Direct (works when the network allows Yahoo or Stooq):**
   `python3 scripts/fetch_prices.py auto TICKER --start YYYY-MM-DD --end YYYY-MM-DD --out data/TICKER.json`
2. **If direct fails** (proxy 403 / blocked host): call the Firecrawl MCP tool `firecrawl_scrape` with
   `alexandria: {"provider":"finance-yahoo-com","capability":"equities/history","options":{"symbol":"TICKER","interval":"1d","start":"YYYY-MM-DD","end":"YYYY-MM-DD"}}`.
   Large results are saved to a file automatically. Don't read the file into context. Import it:
   `python3 scripts/fetch_prices.py firecrawl TICKER --file <saved path> [--file <second chunk>] --start … --end … --out data/TICKER.json`
   The file includes split-adjusted `close`, as-traded `unadjusted_close`, `adj_close`, dividends and splits. Load the tool with ToolSearch if it is deferred.
3. **CPI** (inflation ideas): `fetch_prices.py cpi --out data/CPI.json`. If that's blocked, use the Firecrawl `fred` provider (`series/observations`, series `CPIAUCSL`), save the result as CSV, then run `fetch_prices.py cpi-csv`.
4. **Still nothing?** Stop. Tell the user which hosts were blocked. In Claude Code on the web, they can allow `query1.finance.yahoo.com`, `query2.finance.yahoo.com` and `fred.stlouisfed.org` in the environment's network settings. Or ask for a CSV export (Yahoo Finance or Nasdaq.com historical data) and import it with `fetch_prices.py csv`.

Verification, all required:
- Read every `WARNING` the fetcher prints. A one-day move above 50% must be a real event, not an unadjusted split.
- Confirm the splits in the period, e.g. GME 4-for-1 on 2022-07-22 or TSLA 5-for-1 (2020) and 3-for-1 (2022). The math uses split-adjusted closes, so share counts stay exact.
- **Independently cross-check at least two prices** against a second reputable source using WebSearch, Firecrawl search or a news article: the start close and the key event close. Note whether the source quotes as-traded or split-adjusted prices. A mismatch above 1% after adjustment must be resolved before rendering.
- Use closing prices everywhere. If the story mentions an intraday high, label it as intraday and pull it from the `high` field. Never mix intraday and close values in one claim.

## 3. Compute

`python3 scripts/compute.py projects/<slug>/scenario.json`

This writes `calc.json`: series, facts, assumptions, sources and checks. Every check must say `OK`, and you should read the printed facts table. The facts are what the story can claim, for example `final_value`, `total_return_pct`, `cagr_pct`, `peak_value/date`, `trough_value/date`, `max_drawdown_pct`, `shares_now`, `shares_bought_original_units`, `start_price_unadjusted` and `intraday_high`. For further checks, such as "the value on date X", run a few lines of Python on `calc.json` rather than reasoning in your head.

## 4. Story — hook, turning point, payoff, question

Write **at least five different hooks** from different angles, for example:
- the stake ("$10,000 in 2016…")
- the counterintuitive fact ("It lost 80%… then this happened")
- the question ("Would you have held GameStop?")
- the comparison ("Same $10K. Two very different endings.")
- the personal stake ("If your parents bought…")
- the number tease ("This line hides a 2,000% day")

Score each 1–5 on first-second attention, curiosity, emotional impact, financial stakes, clarity and watch-through potential. Pick the highest truthful total and keep the table for the delivery notes.

Rules:
- The hook is fully visible on frame 0. The component guarantees this, so keep it to **1–3 short lines (≤ ~18 characters each)**.
- Don't open with the same structure as the last video in `projects/`. Check the last few `story.json` hooks.
- Don't reveal the ending in the hook unless that is clearly the stronger story.
- Every claim must be literally true for the stated dates and conventions.

Structure (default 20–25 s; go longer only if the story needs it, max ~35 s):
- **0–2 s:** hook on screen, and the line starts moving at 0.5 s (`timing.drawStartSec`).
- **Development:** the real path, with calendar time evenly paced.
- **Turning point:** 1–3 `events` at verified dates (peak, crash, squeeze, split, earnings shock). Each gets slow motion (`slowdown`, `windowDays`), a hold (`holdSec`), a push-in (`zoom` 1.1–1.3) and a callout whose subtitle uses tokens.
- **Payoff:** about 7 s before the end the result card appears. Its `headline` is a verdict line, e.g. `{GME.multiple:x} your money` or `{T.total_return_pct:pct} in {T.years:int} years`. The big counter already shows the dollar value, so don't repeat it. Use 2–4 stats.
- **Ending:** about 3.4 s before the end, one compelling question tied to the story replaces the hook, e.g. "Would you have held through −80%?"

Vary the look per subject while keeping the system:
- `background` white or offwhite
- `dynamicY` true (dramatic growth) or false (show the whole range, good for crashes)
- `yScale` log for very large multiples over decades (>50x and >15 years)
- event count, zoom strength and duration
- `colorMode` gainloss (single asset: green above cost basis, red below) or series (comparisons; the winner is auto-green)

Write `projects/<slug>/story.json`:
```json
{
 "durationSec": 23, "background": "white", "colorMode": "gainloss", "dynamicY": true, "yScale": "linear",
 "hook": {"kicker": "OPTIONAL SMALL LABEL", "lines": ["Line one", "line two"], "highlight": "substring in green"},
 "counterLabel": "Your $10,000",
 "events": [{"date": "YYYY-MM-DD", "title": "Short", "subtitle": "Close {T@YYYY-MM-DD.close:price}", "tone": "up", "zoom": 1.22, "holdSec": 0.8, "slowdown": 3, "windowDays": 40}],
 "result": {"kicker": "TODAY", "headline": "{T.multiple:x} your money", "headlineTone": "up",
            "subline": "$10,000 → {T.final_value:money}",
            "stats": [{"label": "Total return", "value": "{T.total_return_pct:pct}", "tone": "up"}]},
 "question": "One compelling question?",
 "footnote": "auto",
 "colors": ["optional hex per series"]
}
```
Logos: if `video/public/logos/<TICKER>.png` or `.svg` exists, set `"logo": "logos/<TICKER>.png"` on that asset in `scenario.json`. If none exists, try to download the official logo, e.g. from Wikimedia Commons, into `public/logos/`. Use only a correct, current, clean file. Otherwise the typographic ticker badge is used automatically. Never draw or fake a logo.

Then run `python3 scripts/build_spec.py projects/<slug>`. Fix every `UNVERIFIED` line by replacing the literal number with a token, or prove it and leave a note. Fix every `WARNING` as well. Read the printed hook, events, result and question exactly as they will appear.

## 5. Render

`bash scripts/render.sh <slug>` → `projects/<slug>/out.mp4`. This typechecks, then exports 1080×1920, 30 fps, H.264 High, yuv420p, bt709, with no audio. The chart, counter and callouts all read one frame→data-index timeline, so they can't drift apart.

If a new idea needs something the components can't express, extend the components in `src/` as reusable, typed and data-driven parts. Keep the design system: white canvas, green growth, red loss, charcoal type, light-gray grid, no glow, no fake 3D and no stickmen. Then run `bash scripts/selftest.sh` to make sure nothing else broke.

## 6. Quality control (actually do it)

`bash scripts/qc.sh <slug>` checks export settings and clean decoding, then writes `projects/<slug>/qc/` with:
- `plan.txt`: the expected date and value at each key frame
- `first_frame.png`, `hook_0.3s.png`, `at_1s.png`, `at_2s.png`, `first_2s.png`
- `event*_hold.png`, `draw_end.png`, `result_card.png`, `question.png`, `last_frame.png`
- `contact_sheet.png`: one frame per second

**Open every PNG with Read** and check:
1. **First 2 s:** the hook is readable at frame 0 and the line is visibly moving by 1–2 s.
2. **Data:** the counter and date chip in each frame match `plan.txt`, and event callout numbers match `calc.json` facts. The line shape matches known history: peaks, crashes and recoveries in the right years.
3. **Counter and final math:** the final counter equals `final_value`. Result stats equal the facts and are consistent with each other.
4. **Turning points:** the callout is legible, the zoom keeps the point in frame, and the callout doesn't hide the key part of the line.
5. **Typography and mobile:** nothing under about 21 px, no text clipped, nothing in the platform UI zones (top 170 px, bottom 330 px, right 120 px), and no overlaps.
6. **Rendering:** no glitches, blank frames or jumpy y-axis. Transitions should feel smooth when you compare neighbouring contact-sheet frames.
7. **Ending:** the question is readable and the branding is subtle.

If anything fails, fix the story, spec or components, re-render and re-run QC. Repeat until clean, up to 3 rounds. Then report anything still unresolved.

## 7. Deliver

1. Send the MP4 with `SendUserFile` (`projects/<slug>/out.mp4`, display `render`) and give its path.
2. In the reply:
   - **Selected hook**, plus a compact table of the 5+ hooks with scores
   - **Timeline:** about 6 lines, e.g. `0.0s hook / 0.5s line starts Jan 2016 $10,000 / 6.2s event … / 16s result / 19.6s question`
   - **Data sources:** provider, URL, retrieval time, and the cross-check sources with the matched prices
   - **Assumptions:** every line from `calc.json` assumptions, plus any defaults you chose (amount, dates, dividends, ETF stand-in)
   - **Limitations:** anything unverified, approximated or not fixed, such as no logo or a CPI month carried forward. Write "None" only if that's true.
3. Leave `scenario.json`, `story.json`, `calc.json`, `spec.json` and `data/*.json` in place for reproducibility. Don't commit or push unless the user asks. In a cloud session, tell the user the MP4 lives only in the container until they download it or ask for a commit.
