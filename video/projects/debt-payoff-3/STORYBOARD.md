# 3 Things to Do While Paying Off Debt — storyboard (TEMP TIMING)

Composition `DebtPayoff3Things` · 1080×1920 · 30 fps · 1,562 frames (52.07 s) · source `src/debt-payoff-3/`

> **No voiceover recording was supplied.** Every time below comes from a pace model (`timing.ts`),
> calibrated on the creator's measured ElevenLabs take in the debt-story video: 3.54 words/s while
> speaking, with $-amounts weighted ×1.6. Real delivery will move these by roughly ±10 %. Final sync
> needs the recording. See "Retiming" below.

## Timeline

| # | Time (s) | Narration | Composition | Marcus | On-screen text | Motion / transition |
|---|---|---|---|---|---|---|
| 1 Hook | 0.0–4.7 | If you're trying to pay off debt, here are three things I'd focus on. | Balance card (red-edged), Marcus below. At "three things", three step rows slide in | Shocked looking up at the balance; flinch on landing; hand-to-chin; moves to the corner and points at the steps | **PAYING OFF DEBT?** (frame 0) · TOTAL DEBT **$12,480** · EXAMPLE · 1 EMERGENCY FUND / 2 EXTRA INCOME / 3 NO NEW DEBT | Balance already rolling on frame 0, lands at 0.7 s with a short shake. Slow push. Rows pop in staggered. They then fly up and become the persistent step tracker |
| 2a Fund | 4.4–10.4 | Number one: Build a small emergency fund. Even $500 to $1,000 set aside can help. | Savings panel + $0–$1,000 meter | Curious; tosses three cash bundles into the meter; thumbs-up; relieved | Header **1 EMERGENCY FUND** · EMERGENCY SAVINGS · **$0 → $500** · GOAL $500–$1,000 | Counter and meter $0→$500 on "$500"; the $500–$1,000 range lights on "$1,000". Zoom-through exit |
| 2b Tire | 10.1–13.9 | Because the last thing you want is a flat tire | Night street, sedan (debt-story assets) | Walks up to the car, happy; curious; crouches, shocked; hands on head with sweat | FLAT · SURPRISE EXPENSE | Front tyre squashes, nose dips, air hiss. Camera pushes in to the tyre; red inspection ring. The expense card pops up and holds its screen position into 2c (match cut) |
| 2c Outcomes | 13.6–16.4 | or unexpected bill forcing you right back into debt. | Expense card branches into two equal columns | — | NO SAVINGS → credit card → **↑ NEW DEBT** · $500 SAVED → **$500** → **✓ NO NEW DEBT** | Red branch draws on "forcing"; green branch on "into debt"; losing side dims |
| 3a Income | 16.0–25.5 | Number two: Find a way to bring in extra money. That could mean working overtime, picking up extra shifts, doing DoorDash, or selling things you don't use anymore. | Income bar → checklist | Thinking; fist pump on "extra money"; moves left and points at each row; thumbs-up | **2 EXTRA INCOME** · REGULAR PAY + EXTRA · OVERTIME / EXTRA SHIFTS / DELIVERY GIGS (new order nearby) / SELL UNUSED STUFF, each with +$ | Extra segment grows on "extra money". Each row lands on its spoken word |
| 3b Weeks | 25.2–29.9 | Even an extra $50 or $100 a week can make a difference. | 4-week staircase | — | EXTRA PER WEEK **+$50** · AFTER n WEEKS **$50→$100→$150→$200** · **$50 × 4 WEEKS = $200** · At $100 a week: $400 | One $50 block drops per week (0.43 s apart); the total steps up as each lands |
| 4 Card | 29.6–39.1 | And number three: Stop adding new debt. Because what's the point of paying $300 toward your credit card if you're turning around and charging another $300? | Credit card, balance panel + bar, 3-line ledger | — | **3 NO NEW DEBT** · CARD BALANCE **$1,000 → $700 → $1,000** · −$300 PAYMENT · +$300 NEW PURCHASE · BACK TO $1,000 · *Simplified example. Excludes interest and fees.* | Green chip flies in from the left → balance counts down, bar shrinks. Red chip from the right → counts back up, shake, badge |
| 5 Ending | 38.7–48.7 | I'm working toward becoming debt-free myself, and one thing I'm learning is that it's not just about how much you pay off. It's about changing the habits that got you there. | Payoff track START → DEBT FREE flag | Walks along the track (walk cycle), stops, determined; fist pump on "habits" | **PAYING IT OFF / IS ONE THING.** · **STAYING OUT / IS THE GOAL.** · IN PROGRESS (no percentage) | Flag rises on "debt-free". Calm sweep on the fill. All three tracker steps pulse-check on "habits" |
| 6 CTA | 48.4–52.1 | What's been the hardest part of paying off your debt? | Comment icon, question, Marcus | Faces the camera, open-palm shrug | **WHAT'S YOUR BIGGEST DEBT STRUGGLE?** | Words rise; tracker fades; clean hold to the end |

Persistent layers: step tracker (y 180), step header (y 262), captions (y 1310–1480, one group per
phrase, key word in green), @stackwithgio mark (y 1546). Everything sits inside the TikTok/Reels/Shorts safe zone.

## Assets used

| Asset | Source | Status |
|---|---|---|
| Marcus rig (`src/debt-story/Marcus.tsx`) | Copied unchanged from `claude/debt-story-video` (unmerged, no PR) | **Existing artwork, approval not documented.** Not the Phase 3 upgraded rig (not built yet) |
| Car, street, cards, cash, icons, stage/camera, palette, easing | Same branch, unchanged | Existing |
| SFX (`public/debt-story/sfx/*.wav`) | Same branch (synthesised by `scripts/debt-story-sfx.sh`) | Existing |
| Voiceover | — | **Missing** |
| Brand font | Inter (bundled) | Existing |

## Retiming to the real recording

1. Put the file at `public/debt-payoff-3/narration.mp3`.
2. Measure the phrase boundaries: `ffmpeg -i narration.mp3 -af silencedetect=noise=-32dB:d=0.07 -f null -`, plus RMS dips inside dense phrases (the same method as the debt-story storyboard).
3. In `timing.ts`, replace the pace model with the measured `{start, end}` per phrase id. The ids stay the same, so scenes, captions, SFX and transitions all follow.
4. Render with `--props='{"voiceover":"debt-payoff-3/narration.mp3","draft":false}'`.
