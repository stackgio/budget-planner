# V1 vs V2 — "3 Things to Do While Paying Off Debt"

| | V1 (`DebtPayoff3Things`) | V2 (`DebtPayoff3ThingsV2`) |
|---|---|---|
| File | `projects/debt-payoff-3/3-things-paying-off-debt_TEMP-TIMING_no-vo.mp4` (unchanged) | `projects/debt-payoff-3-v2/3-things-paying-off-debt_V2-cinematic_TEMP-TIMING_no-vo.mp4` |
| Style | Animated explainer: panels on matte black, Marcus stickman, persistent 1-2-3 tracker | Cinematic finance documentary: licensed real footage, editorial type, numbers only where they explain |
| Length | 52.07 s (temp timing) | 52.07 s (same timing table) |
| Export | H.264 High 1080×1920 30 fps, 9 MB | H.264 High 1080×1920 30 fps, 37 MB |

Side-by-side frames at matching timestamps: `v1-vs-v2.png` (V1 top, V2 bottom).

## Status (both versions)

- **No voiceover exists yet.** Both cuts use the same temporary pace model, so neither is audio-synchronised. The audio is SFX only (peak −13.8 dBFS).
- Financial math is verified for both: `npx tsx scripts/dp3-check.ts` gives 20/20 pass, including that V2 uses exactly V1's figures.

## V2 shot list

| Time (s) | Narration | Shot | On screen |
|---|---|---|---|
| 0.0–2.2 | If you're trying to pay off debt, | Bank statement + calculator, slow push | **PAYING / OFF / DEBT?** (frame 0) · TOTAL DEBT · EXAMPLE **$12,480** (rolling) |
| 2.2–4.7 | here are three things I'd focus on. | Whip pan to a credit-card chip macro | Giant outlined **3** · **THINGS** · I'D FOCUS ON |
| 4.7–7.3 | Number one: Build a small emergency fund. | White flash → coins pouring into a jar | **01** · **EMERGENCY FUND** |
| 7.3–10.3 | Even $500 to $1,000 set aside can help. | Same jar, defocused | EMERGENCY SAVINGS **$0 → $500**, bar to $1,000 with the $500–$1,000 range marked |
| 10.3–13.2 | Because the last thing you want is a flat tire | Flat-tyre photo, push into the tyre | **FLAT TIRE.** |
| 13.2–14.1 | or unexpected bill | Mechanic at the wheel | **SURPRISE BILL.** |
| 14.1–16.2 | forcing you right back into debt. | Tyre, defocused | NO SAVINGS → **IT GOES ON THE CARD.** / $500 SAVED → **PAID. NO NEW DEBT.** |
| 16.2–21.3 | Number two: … extra money. … working overtime, | Whip → clock time-lapse | **02 EXTRA INCOME** · OVERTIME |
| 21.3–23.2 | picking up extra shifts, doing DoorDash, | Delivery courier | EXTRA SHIFTS · DELIVERY |
| 23.2–25.6 | or selling things you don't use anymore. | Hands taping a parcel | SELL WHAT YOU DON'T USE |
| 25.6–29.8 | Even an extra $50 or $100 a week can make a difference. | Parcel, defocused | **+$50 /WEEK** with four week blocks → **+$200 IN 4 WEEKS** · At $100 a week: $400 |
| 29.8–35.9 | And number three: Stop adding new debt. Because … paying $300 toward your credit card | Dip to black → card macro | **03 STOP ADDING NEW DEBT.** → CARD BALANCE **$1,000 → $700** · −$300 PAYMENT |
| 35.9–38.8 | if you're turning around and charging another $300? | Card + phone purchase | **$700 → $1,000** · +$300 NEW PURCHASE · $1,000 − $300 + $300 = $1,000 · *Simplified example. Excludes interest and fees.* |
| 38.8–42.1 | I'm working toward becoming debt-free myself, and one thing I'm learning | Man walking away down a street | PAYING IT DOWN · EXAMPLE **$12,480 → $11,980** (slow) |
| 42.1–48.6 | is that it's not just about how much you pay off. It's about changing the habits that got you there. | Golden-hour portrait | **PAYING IT OFF IS ONE THING.** / **STAYING OUT IS THE GOAL.** |
| 48.6–52.1 | What's been the hardest part of paying off your debt? | Portrait, heavily defocused | **WHAT'S YOUR BIGGEST DEBT STRUGGLE?** |

Captions appear on only 9 of 42 phrases: the lines no headline already says.

## Scores (1–10)

| Category | V1 | V2 | Why |
|---|---|---|---|
| Visual variety | 4 | **8** | V1 repeats one panel-on-black composition with the same tracker and header in every scene. V2 changes shot, scale and type layout at every idea: macro, close-up, still, portrait, centred numbers, stacked left-aligned titles |
| Storytelling | 7 | 7 | V2 makes the stakes real (a real tyre, a real purchase, a person walking forward) and lands the ending emotionally. V1 explains the *mechanics* better: its side-by-side outcome and the three-line card ledger are clearer than V2's text-over-blur outcome beat |
| Typography | 7 | **8** | V2 has editorial scale and varied layouts (giant outlined "3", stacked chapter titles, a centred money hero) and far less text on screen. Weak spots: 26–30 px kickers, and "THINGS" sits over busy card digits |
| Cinematic quality | 3 | **7** | V2 has real footage, a consistent grade, grain, camera moves, whip/flash/dip transitions and motivated cuts on words. It's held back by recognisable stock (the courier smiles into the lens), a still standing in for the tyre, two 1080p sources that are soft once cropped to vertical, and mismatched locations |
| Pacing (provisional) | 6 | 6 | Same temp timing. V2 cuts faster in step 2 (the courier shot is about 0.7 s of DoorDash) and holds the outcome beat only about 1.2 s |
| Professional appearance | 6 | **7** | V2 reads like an edited short rather than an animated template. V1 is clean but looks like an explainer deck |

## Which version better supports the story?

**V2, with one caveat.** The script is personal and behavioural ("I'm working toward becoming debt-free myself… it's about the habits"). Real-world footage and restrained type carry that tone. V1's stickman and dashboard panels made it feel like a lesson rather than a story.

**The caveat:** V1 still teaches the two key numeric ideas more clearly. Port these into V2:
1. V1's **side-by-side outcome** (same bill → card = new debt vs savings = no new debt) as a split frame over the tyre footage.
2. V1's **three-line ledger** in the card beat. V2 shows the equation, but only once the sequence ends.

## V2 weaknesses and fixes

1. **Voiceover.** Retime `src/debt-payoff-3/timing.ts`; it drives both versions. Re-check that the courier shot is at least 1.2 s and the outcome beat holds.
2. **First-person footage.** The narration says "I"/"myself", but the ending uses stock actors. Your own footage (walking, at a desk, a real tyre or receipt) would make it genuinely documentary.
3. **Soft sources.** Replace the two 1080p clips (card macro, coin jar) with 4K versions so the vertical crop stays sharp.
4. **Flat tyre.** A video clip would beat the still; none exists in free Adobe Stock, but paid Stock does have them (needs your OK on cost).
5. **Courier shot.** The courier looks into the lens, which reads as stock. Prefer an over-the-shoulder or POV delivery shot.
6. **Golden-hour framing.** The source frames the subject's head at the top edge. A different take, or a reframed 4K original, would fix it.
7. **Question mismatch.** On screen: "biggest debt struggle?"; spoken: "hardest part of paying off your debt?". V2 suppresses the caption, so they no longer compete, but aligning the wording is still better.
