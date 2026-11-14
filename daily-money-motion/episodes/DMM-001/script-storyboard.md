# DMM-001 — "Your $500 raise. Where does it go?"
Pillar 5 · Spending & lifestyle inflation · Engine B (financial motion graphics) · Composition `DMM001` · 450 frames / 15.0 s / 30 fps / 1080×1920
Reference: REF-0001 (format), with principles from REF-0004 and REF-0005. See `adaptation-notes.md`.

## On-screen text (32 words, excluding numbers and the footnote)
YOU GOT A $500 RAISE. / WHERE DOES IT GO? · 1 SPENDS IT · 2 INVESTS IT · +$500 / MO · Nicer car · Eating out · Subs · SPENT · KEPT · WORTH · YEAR n · PUT IN $60,000 · +$26,542 GROWTH · Lifestyle creep doesn't / feel like a choice. / It is one. · STACK WITH GIO
Footnote (always on): EXAMPLE · $500/mo for 10 yrs at a hypothetical 7%/yr, compounded monthly. Not guaranteed. Not advice.

## Timed storyboard (one continuous frame, no cuts)
| Time | Frames | Act | Picture | Sound |
|---|---|---|---|---|
| 0.0–0.2 s | 0–5 | HOOK | The question headline and both panels are readable on frame 0. Both panels carry an identical "+$500 / MO" chip. | Pulse kick + pop |
| 0.2–1.5 s | 5–46 | HOOK | Panel 1's empty dashed bar is claimed by $250 Nicer car → $150 Eating out → $100 Subs. The raise is gone in about a second. | card / click on each |
| 1.7–6 s | 50–180 | BUILD | The year track starts. SPENT counts up and KEPT stays $0 (shake at 4.0 s, second hook). Panel 2 WORTH counts up as the emerald curve draws over the dashed money-put-in line. Panel 1 slowly drains of colour. | Full kit, chord walk |
| 6–11.5 s | 180–345 | PAYOFF | The curve visibly bends away from the dashed line (compounding). The key light drifts toward panel 2. At 11.5 s (year 10) the counters settle: SPENT $60,000 / KEPT $0 vs WORTH $86,542. The "+$26,542 GROWTH" pill, the gap bracket and "PUT IN $60,000" land. Panel 2 lifts with an emerald edge glow. | Riser → resolve chord + coin + chime |
| 11.5–12.6 s | 345–378 | PAYOFF HOLD | Everything holds so the numbers can be read (cover frame = 372). | Resolved chord |
| 12.6–15 s | 378–450 | ENDING | Masked headline swap: "Lifestyle creep doesn't feel like a choice. It is one." The year track gives way to the STACK WITH GIO signature. Clean end hold. | Whoosh-soft, chord decay, fade |

## Numbers (all hypothetical, computed in `video/src/daily/episodes/dmm001/facts.ts`)
- Raise: $500/mo after tax (example). Spender split $250 + $150 + $100 = $500.
- Spent in 10 yrs: 500 × 120 = **$60,000**. Kept: **$0**.
- Invested: FV = 500 × ((1+0.07/12)^120 − 1)/(0.07/12) = **$86,542** (end-of-month contributions). Put in **$60,000**. Growth **$26,542**.
- Cross-checked independently in Python: 86,542.40.
- Fees, taxes and inflation are not modelled. That is disclosed by "hypothetical" and "Not guaranteed"; see the improvement notes in the QC report.
