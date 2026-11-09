# The Complete Beginner Investing Guide — Stack With Gio

Composition `BeginnerInvestingGuide` · 1080×1920 · 30 fps · 113.3 s · mode `education`
Narration: creator's ElevenLabs MP3 (111.65 s, byte-identical, sha256 4b2bee7a…), word-aligned (ElevenLabs Scribe), 322/322 words matched.
Look: brand-dark — matte black `#080B09`, green `#39FF14`, white, muted gray (`brandDark` in `src/story/theme.ts`).

## Scene-by-scene timing (seconds, from the aligned voice)

| # | Scene | Window | Lines | What the viewer sees | Transition in |
|---|---|---|---|---|---|
| 1 | hook | 0.0–4.5 | L1 | "START INVESTING FROM $10" over the REAL Robinhood order screen (Est. cost $10.01 highlighted); roadmap chips 1 App · 2 Account · 3 ETF · 4 Buy on "exactly" | — (frame 0 readable) |
| 2 | intro | 4.1–9.6 | L2–L3 | Stack With Gio bug, "Not a financial advisor" pill, MY PERSONAL INVESTING JOURNEY, "Educational content • Investing involves risk", Marcus shrug → present | slide up |
| 3 | apps | 9.1–19.0 | L4–L6 | 01 · Fidelity / Charles Schwab / Robinhood cards on each name; Robinhood lights "What I use" on "I personally use"; footnote "compare fees & features yourself" | wipe |
| 4 | account | 18.5–38.3 | L7–L11 | 02 · Brokerage vs Roth IRA cards; facts reveal on their words (flexible access · taxes may apply on gains · designed for retirement · qualified withdrawals tax-free · eligibility & withdrawal rules apply); "neither is better" | slide |
| 5 | bank | 37.8–41.9 | L12 | 03 · Bank → Investing account → Available to invest, green line + traveling coin | dark-green panel sweep |
| 6 | stuck | 41.5–51.1 | L13–L15 | 04 · WHAT DO I BUY? with ticker tiles; AAPL / NVDA light on their names; on "ETFs" tiles snap into a cluster, "START WITH ETFs" | fade |
| 7 | etf | 50.8–55.0 | L16 | Cluster arcs into the ETF basket: ONE FUND / MANY INVESTMENTS | match cut (same tiles) |
| 8 | voo | 54.5–64.1 | L17–L18 | VOO · Vanguard S&P 500 ETF · tracks the S&P 500; 500-dot grid fills with "EXPOSURE TO ~500 COMPANIES"; "Large U.S. companies — not the whole global market"; "My holding · not a recommendation" | iris from basket |
| 9 | fraction | 63.6–67.8 | L19 | YOU DON'T NEED A FULL SHARE — one share ($677.04, price in the recording) split into 100; $10 ≈ 1.5% lit; "varies as price moves" | slide up |
| 10 | buy | 67.5–79.3 | L20–L21 | REAL recording, steps 1–6 (search VOO → open VOO → Trade → Buy → 0.014771 shares ≈ $10.01 → review amount & account → swipe to submit → genuine "VOO order queued" screen). Callouts: "I entered shares — you can also buy in dollars", "Order queued for market open", "Once it fills → you own a fraction of VOO" | wipe |
| 11 | dividend | 78.7–87.8 | L22–L23 | 05 · REAL dividend screenshot: $5.35 (paid Sep 30, 2026) → DRIP setting screenshot "Enabled" → reinvestment row; chain VOO pays a dividend → $5.35 received → Automatically reinvested → +0.007628 VOO shares; "From VOO shares I already own — not the $10 order" | dark-green panel sweep |
| 12 | habit | 87.3–96.7 | L24–L25 | 06 · $5 · $10 · $20 per paycheck; EXAMPLE timeline Paycheck 1–4 × +$10 → Total contributed $40; "Contributions only — no returns" | slide |
| 13 | risk | 96.3–105.1 | L26–L27 | INVESTMENTS CAN LOSE VALUE, up-and-down line (labelled "Illustration — not real data"), checklist Bills first · Emergency savings · Invest what fits your budget | fade |
| 14 | end | 104.5–113.3 | L28–L29 | "I'M ONLY 22 / still learning, too" with Marcus → logo, LEARN. INVEST. BUILD., FOLLOW STACK WITH GIO | iris |

## Asset usage

| Asset | How it's used | Altered? |
|---|---|---|
| ElevenLabs voice MP3 | sole narration, 1.0×, full length | No (byte-identical copy, sha256 verified) |
| Robinhood screen recording (HEVC, 16.4 s, 60 fps) | frames from 1.5 s onward extracted to JPG @30 fps (`public/motion/.../assets/rec/`) and played re-timed (holds / fast-forward) in the hook + buy scenes | Pixels untouched; opaque privacy panels drawn on top; home screen (portfolio value) never used |
| VOO dividend screenshot (PNG 1206×2622) | dividend scene, framed/zoomed + green outlines | No |
| DRIP settings screenshot (JPG 1206×744) | dividend scene, full frame, "Enabled" outlined | No |

Privacy masks (recording): "VOO · 2.95 shares" in search results; "Your position" rows (shares / market value / return) on the VOO page; "Individual · $X available" buying-power line on the order screen.

## Facts
All on-screen numbers live in `src/videos/beginner-investing-guide/facts.ts` with provenance. Personal: 0.014771 shares, $10.01 est. cost, $677.04 market price (recording); $5.35, $1.82/share, 2.938 shares, 0.007628 shares @ $701.34, Sep 28 / Sep 30 / Oct 1 2026 (screenshot). Computed: $10 ÷ $677.04 ≈ 1.5 %. Hypothetical (labelled EXAMPLE): $10 × 4 paychecks = $40.

## Regenerating the recording frames (not committed — they contain unmasked balances)
```bash
cd video && mkdir -p public/motion/beginner-investing-guide/assets/rec && \
ffmpeg -ss 1.5 -i <ScreenRecording_11-08-2026_18-22-01_1.MP4> -vf fps=30 -q:v 2 -start_number 0 \
  public/motion/beginner-investing-guide/assets/rec/r%03d.jpg   # → r000.jpg … r446.jpg
bash scripts/motion/render.sh beginner-investing-guide public/voice/beginner-investing-guide/props.final.json
```
