# V3 — cinematic documentary + premium financial motion graphics

**Composition:** `DebtPayoff3ThingsV3` · **File:** `3-things-paying-off-debt_V3_TEMP-TIMING_no-vo.mp4` · 1080×1920, 30 fps, H.264 High, 52.07 s, 48 MB

**TEMPORARY-TIMING PREVIEW. No voiceover recording exists yet.** V1, V2 and V3 all read one timing table (`src/debt-payoff-3/timing.ts`), so the recording retimes all three. The audio is SFX only (peak −13.8 dBFS).

V1 and V2 are untouched: their compositions, source and MP4s are unchanged, and git shows no diff.

## What V3 is

V2's licensed footage and editorial type, with V1's explanations rebuilt *inside* the shots:

| Beat | V3 treatment | Came from |
|---|---|---|
| Hook | Example balance on a frosted card, tilted with the bank statement and tracking the camera push | V2 footage + V1 balance |
| Step 1 savings | Glass **savings meter** standing in the coin jar ($0 → $500, $500–$1,000 goal band) and rising as the coins fall. Parallax-tracked to the push | V1 meter, made physical |
| Same bill, two outcomes | A real **split screen**: the flat tyre (top, "IT GOES ON THE CARD ↑ NEW DEBT") vs the jar (bottom, "PAID FROM SAVINGS ✓ NO NEW DEBT"). The frame splits on "into debt" | V1's comparison, with footage |
| Step 2 income | Glass **income breakdown** that stays on screen across the clock → courier → parcel cuts and grows one segment per spoken source (+ OVERTIME, + EXTRA SHIFTS, + DELIVERY, + SELLING STUFF) | V1's income bar, made the thread between cuts |
| $50/week | Glass **staircase** ($50 → $100 → $150 → $200) over the defocused parcel, "+$50 A WEEK" → "+$200 IN 4 WEEKS", "At $100 a week: $400" | V1 staircase + V2 type |
| Step 3 card | Glass **card statement**: balance, bar and 3-line ledger. It carries across the cut from the card macro to the phone purchase; the "+$300" chip flies in from the phone. Disclaimer inside the panel | V1 ledger, integrated |
| Ending | Example balance slowly paid down ($12,480 → $11,980) as he walks; closing lines over golden hour; question | V2 |

## Requested improvements — what changed, measured

| Request | Result |
|---|---|
| **Brighten dark footage** | Mean luma per shot (16 = black): defocused jar 49→**89**, outcome 41→**65**, purchase 47→**83**, weekly 54→**103**, card 59→**97**, CTA 47→**72**. 14 of 16 shots are brighter. Repair is only 36→**42**: the source is very dark and on screen for 0.9 s, and lifting it further turns it to noise. The clock is black by design. The hook was already the brightest shot (−4) |
| **Readable on mobile** | Every information text is ≥ 40 px, except the disclaimer at 34 px (it sits inside a glass panel, so it's legible on any footage). V2 had 26–30 px kickers, week labels and the disclaimer. Readability now comes from local gradients behind type, not whole-shot dimming |
| **Remove small captions** | All captions removed (V1: every phrase; V2: 9 small 50 px captions; V3: 0) |
| **Integrated graphics** | Frosted glass shows the footage through it. Graphics share each shot's camera move at a parallax depth (0.4–0.7). The income bar and card statement persist across cuts and become the thread between shots. The meter sits in the jar and fills with the pour. The outcome is real footage, not text on blur |
| **Varied composition, purposeful camera** | Pushes into the tyre and the jar; a pan that moves the jar aside for the meter; a whip to the card; a split frame; a dissolve from the statement into the walk |
| **Verified or labelled amounts** | No personal figures were supplied, so every number is a labelled example from the script. Hook and ending say "EXAMPLE"; the card says "Simplified example. Excludes interest and fees." `scripts/dp3-check.ts` passes 20/20 and confirms all three versions use identical figures |
| **No Marcus** | Removed |
| **Preserve the script** | Same 42 phrases, same timing table |

## Problems found in V3 preview and fixed before export

1. **Black strip on the right of the jar shot.** The meter pan moved the plate past its edge. The pan is now limited to the zoom margin, and every frame's left and right 12 px strips were scanned (only the black-background clock remains, by design).
2. **"+ EXTRA SHIFTS" collided with "MONTHLY INCOME".** The current source now gets its own 66 px line.
3. **Card disclaimer sat over busy card digits.** It moved inside the glass statement.
4. **The card result held only ~4 frames.** Found by checking the final file at 38.6 s. The count is now faster and the statement holds about 0.8 s before dissolving into the next shot.
5. **"NO NEW DEBT" landed ~0.6 s before step 2.** Brought in earlier.
6. **One 38 px badge** raised to 42 px.

## Scores (1–10, all temp-timing)

| Category | V1 | V2 | V3 | What changed in V3 |
|---|---|---|---|---|
| Visual variety | 4 | 8 | **8** | Same shot variety as V2, plus a split frame and graphics that differ per beat |
| Storytelling | 7 | 7 | **8** | Keeps V2's real stakes and gets back V1's clear "two outcomes", income build-up and card ledger |
| Typography | 7 | 8 | **8** | V2's editorial scale, no small text, no captions. The meter tick labels (44 px) sit over busy coins |
| Cinematic quality | 3 | 7 | **7** | Brighter, cleaner grades and integrated glass graphics. Same stock limits as V2 (posed courier, still for the tyre, soft 1080p sources, mismatched locations) |
| Financial clarity | 8 | 5 | **8** | V2 dropped V1's comparison and ledger; V3 restores both inside the footage |
| Pacing (provisional) | 6 | 6 | **6** | Same temp timing. The card and outcome results hold only 0.6–0.8 s because the narration moves on; a real voiceover pause may give more room |
| Professional appearance | 6 | 7 | **8** | Graphics look designed for the shot rather than pasted on, and nothing is too dark or too small to read |

**V3 is the strongest of the three.** It keeps V2's documentary feel and gets back V1's clarity on the numbers.

## Remaining weaknesses

1. **No voiceover.** Retime with the recording, then re-check the two short result holds (outcome about 0.6 s, card result about 0.8 s).
2. **Stock stand-ins for "I"/"myself".** Your own footage would make the ending genuinely personal.
3. **Footage limits:**
   - The repair clip is too dark to rescue; replace it with a brighter repair-shop clip.
   - The card and jar sources are 1080p, so they're soft at vertical crop; 4K replacements would fix it.
   - A real flat-tyre video would beat the still (paid Stock only; needs your OK on cost).
4. **The courier looks into the lens.** It's the most "stock" moment; an over-the-shoulder or POV delivery shot would be better.
5. **The on-screen question** ("biggest debt struggle?") still differs from the spoken one ("hardest part of paying off your debt?").
