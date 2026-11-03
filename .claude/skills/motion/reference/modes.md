# The 7 video modes

Classify every request into one mode and put it in `META.mode`. When a request straddles two modes, pick the one whose **evidence** dominates. For example, "my dividend portfolio hit $100/month" is `dividend` (real screenshots), not `motivational`. When narration exists, its length sets the duration. Otherwise use the target below and never stretch a short idea.

| Mode (`META.mode`) | Cues in the request | Target | Evidence rule |
|---|---|---|---|
| `personal-journey` | "my debt payoff", "update", "I saved", "mistakes I made", "month N" | 30–45 s | real screenshots and numbers from the creator only |
| `education` | "how X works", "3 steps", "explain", "mistakes to avoid", "beginner" | 30–60 s | hypothetical example numbers, labelled "Example" |
| `historical-graph` | "$X invested in T N years ago", "S&P 500 growth", "vs", "monthly investing" | as needed (20–35 s) | verified market data only (the `/graph` pipeline) |
| `budget` | "paycheck", "budget", "50/30/20", "where my money goes" | 20–40 s | real figures or screenshots, or a labelled example |
| `meme` | "meme", "POV", "when you…", "me after…" | 8–20 s | none needed; never imply a real result |
| `dividend` | "dividends", "portfolio", "shares", "passive income challenge" | 20–45 s | real portfolio screenshots; blur account info |
| `motivational` | "why I…", "start now", "discipline", "future you" | 20–45 s | numbers must be real or labelled hypothetical |

## 1 · personal-journey
- Story: the situation → the decision → the real progress → what's next. Real numbers are the hero.
- Visuals: `Screenshot` (real statement or app) with `zoomTo` and `mark` on the key figure, then the same number lifted out into a `NumberCounter` or `DebtMeter`/`ProgressBar` (the continuity move). Marcus reacts in a supporting role.
- **Never** invent balances, dates or progress. If a number isn't in the creator's text or screenshots, ask. Don't round real numbers for drama. Blur account numbers, names and emails (`redact`).

## 2 · education
- Story: the relatable problem → numbered ideas (`ChapterTag` 01/02/03) → the payoff → a question or CTA.
- Visuals: warm editorial scenes, Marcus acting out each idea with an object (card, bill, jar, receipt), worked examples computed in `facts.ts`/`numbers.ts` (see `debt-three-things/numbers.ts` for a payoff schedule computed in code), and one cinematic chapter for contrast.
- Every example number carries an on-screen "EXAMPLE" label. APR, fees and schedules must be internally consistent: compute them, don't type them.

## 3 · historical-graph
- **Data first, always:** follow `.claude/commands/graph.md` steps 1–3: scenario → `fetch_prices.py` (Yahoo/Stooq, or the Firecrawl `finance-yahoo-com` provider) → cross-check at least 2 prices against a second source → `compute.py` (handles splits and reinvested dividends) → read `calc.json` facts and checks.
- **No narration:** finish entirely through `/graph` (`GraphVideo`, `build_spec.py`, `render.sh`, `qc.sh`). It's purpose-built: L-axes, event slow-motion, tip tags.
- **With narration:** build a narrated video here. Copy `projects/<slug>/calc.json` to `src/videos/<slug>/calc.json` and `import calc from './calc.json'`, draw it with `StoryGraph` (white or cinematic look), and land events on the words that name them. On-screen numbers come only from `calc.json`.
- State the assumptions on screen (small footnote) and in the delivery report: dividends reinvested or price-only, split-adjusted, nominal vs. inflation-adjusted (CPI via `fetch_prices.py cpi`), start/end dates, data source.
- If the data can't be retrieved or verified, **stop** and ask for a CSV. Never estimate.

## 4 · budget
- Story: the paycheck arrives → it splits into buckets → the insight (what's left, what moved).
- Visuals: `AllocationBar` (segments revealed on the words naming each category), `Receipt` printing line items, `Wallet`/`CashStack`, `ProgressBar` for savings goals, and a real budget screenshot if provided. Totals are computed (`items.reduce`) and must equal the stated paycheck.
- Use cream or white backgrounds with clean dashboard compositions. Prioritise clarity over flourish.

## 5 · meme
- Story: setup → turn → punchline, in 2–4 scenes with a fast cut on the punchline.
- Visuals: Marcus carries it (expressive poses: `shock`, `flinch`, `shrug`, `smug`, `celebrate`; cycles: `breathe-hard`, `cheer`), one financial object as the prop, a big kinetic caption at the top ("POV: …" / "ME AFTER…"), and a `thud`/`pop`/`stamp` on the beat.
- Don't overproduce: 1 location, 1 idea, ≤ 20 s. Comedic timing means holding the reaction for 0.4–0.8 s before the cut.

## 6 · dividend
- Story: the challenge → the real payout or screenshot → share accumulation → the milestone or next target.
- Visuals: `Screenshot` (brokerage or dividend notice, **redact** account numbers and balances the creator didn't mention) → coins arcing into a `SavingsJar` labelled with the real amount → a share-count `NumberCounter` → a `ProgressBar` toward the goal with milestones. Use gold for payouts and green for growth.
- Keep the authentic screenshot's colours and layout. Never recreate or "clean up" a brokerage UI as if it were real.

## 7 · motivational
- Story: a tension the viewer feels → a reframe through a visual metaphor (a stack growing, a path, a time-lapse desk, a meter refilling) → a quiet, confident ending.
- Visuals: mostly cinematic, with kinetic typography as a lead (`slam` sparingly, `rise` + marker sweeps), slow camera, Marcus in silhouette-like moments (walking cycle, looking at a horizon of bars). Any number shown must be real or labelled hypothetical.
- Avoid the stock-motivation slideshow: no quotes on gradients, no random b-roll, no clichés.
