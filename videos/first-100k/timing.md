# Voiceover map and scene plan — "Your first $100,000"

Source: ElevenLabs VO, 25.16 s, mono 44.1 kHz.
Phrase boundaries come from `ffmpeg silencedetect` (-35 dB, 0.18 s). Wording was confirmed by
transcribing each chunk with Whisper small.en (sherpa-onnx). In-phrase word onsets come from
transcribing sub-chunks and from the energy envelope.

| Speech (s)   | Words                                              | Visual beat |
|--------------|----------------------------------------------------|-------------|
| 0.06 – 1.16  | Here's how long it could take                      | Frame 0: YOUR FIRST $100,000 already on screen; question + two cards slide in |
| 1.16 – 3.79  | to build your first (1.72) hundred-thousand-dollar (≈2.0) portfolio | Caption 2 |
| 3.85 – 4.75  | (pause)                                            | $100,000 flies into goal badge; contribution card → row 1; time card → row 1 duration slot |
| 4.18 – 5.14  | Starting from zero                                 | Axis builds; footnote "Starting at $0" ($0 emphasised) |
| 5.40 – 7.25  | assuming eight percent annual growth               | Footnote "Assumed 8% annual rate" (8% emphasised); line 2 |
| 7.66 – 9.21  | Invest a hundred dollars a month                   | Row 1 "$?" → "$100" at 7.90; bar extends 8.55–9.75 |
| 9.49 / 9.80  | about / twenty-six years                           | "≈26 YEARS" at 9.80 |
| 11.17 – 12.03| Two hundred fifty                                  | Row 2 card + "$250"; bar 11.55–12.50 |
| 12.32 / 12.55| about / sixteen years                              | "≈16 YEARS" at 12.55 |
| 13.89 – 14.56| Five hundred                                       | Row 3; bar 14.15–15.05 |
| 14.85 / 15.11| about / eleven years                               | "≈11 YEARS" at 15.11 |
| 16.37 – 17.03| A thousand                                         | Row 4; bar 16.65–17.50 |
| 17.30 / 17.55| about / six and a half years                       | "≈6½ YEARS" at 17.55 |
| 17.95 – 18.85| (tail + pause)                                     | Payoff: rows 1 & 4 highlighted; "$100/mo → ≈26 years" / "$1,000/mo → ≈6½ years" |
| 18.85 – 19.27| (pause)                                            | "SAME GOAL. DIFFERENT TIMELINES." Badge and goal dots pulse |
| 19.27 – 20.58| Returns aren't guaranteed                          | "ILLUSTRATION — RETURNS ARE NOT GUARANTEED" banner (stays to end) |
| 20.84 – 23.31| but your monthly (≈21.0) contribution makes a big difference (22.55) | Contribution column highlighted; $100-row finish line projected onto rows 2–4, gaps shaded |
| 23.20 – 23.90| (transition)                                       | Row cards morph into four choice cards |
| 23.72 – 24.86| Which amount could you stick with?                 | Question shown; choices highlighted in sequence, then held to 25.17 |

Bar lengths use exact months/12 on a shared 0–30-year scale (27 px per year):
25.583 → 690.8 px, 16.333 → 441.0 px, 10.667 → 288.0 px, 6.417 → 173.3 px.

## v2 changes (hook + retention pass)

| Time (s)    | Visual |
|-------------|--------|
| 0.00 – 1.35 | Hook: YOUR FIRST $100,000 COULD TAKE. The $100/mo bar runs to ≈26 YEARS (lands 0.85), "…or", then the $1,000/mo bar lands on ≈6½ YEARS (1.10) |
| 1.45 – 2.60 | The $100 finish line drops onto the $1,000 bar; the gap shades in and is labelled YEARS SAVED; slow push-in to 3.85 |
| 3.82 – 4.60 | Hook exits; $100,000 flies into the goal badge; the axis builds |
| 4.20 / 5.42 | Assumption cards: STARTING BALANCE $0, then ASSUMED RETURN 8%/YEAR (compounded monthly) |
| 7.32 – 8.00 | The cards shrink into the footnote and the disclaimer ("Illustration assumes 8% annual return. Returns aren't guaranteed.") |
| each row    | The card slides in on the amount; the bar extends; the duration punches in on the spoken number; the dashed $100 finish line and shaded YEARS SAVED gap draw on +0.15–0.85 s |
| 19.27       | The disclaimer turns amber with a brief scale-up |
| 20.95 – 23.4| Contribution column highlighted |
| 23.42 – 26.6| Full four-row comparison stays on screen; CTA "Which amount could you realistically invest every month?"; rows highlighted in turn (23.85–25.6), then all held |

Captions show the narration verbatim (amounts and durations in green) in a band below the disclaimer, at most two lines, never over the chart.
