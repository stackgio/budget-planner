# Debt story V2: what changed

Final file: `stack-with-gio-debt-story-v2.mp4`. It is 1080×1920 at 30 fps (H.264/AAC), 41.0 s,
normalized to −14 LUFS with a −1.5 dBTP peak. The voiceover is unchanged and there is no music.
V1 (`stack-with-gio-debt-story.mp4`) is kept for comparison.

## 1. First two seconds (0.0–4.4 s)
- **Frame 0:** an extreme close-up of the tire squashing flat with a hiss. A REPAIR BILL slaps into frame at 0.3 s
  and Marcus is in the foreground, shocked and sweating. The headline "WHY DOES EVERYTHING BREAK?!" is fully
  readable from frame 0. The old static progress-bar card is gone.
- **1.0 s, "the moment you start paying off debt":** a fast zoom-blur cut to Marcus swinging a hammer at a DEBT
  block. The block shrinks with each of the three hits, and a "PAID" pops up on each.
- **2.92 s, "EVERYTHING":** the frame shakes and flashes red. A repair bill, envelopes and a loose tire crash in.
  The block grows back, Marcus drops the hammer, and he goes from shock to steam and anger. A red warning
  expands into the flat-tire scene.
- The opening only shows things the narration names (a tire and repair bills), with no amounts.

## 2. Visual storytelling
- **Marcus:** same white stickman and backward black cap, now with reaction effects: sweat, shock lines,
  steam, an anger mark, comic tears (on "not collect more of it!") and a sparkle for the realization moments.
- **Fewer floating cards:** the floating "UNEXPECTED EXPENSE" cards and the fund and plan dashboard cards are
  replaced with tangible objects:
  - a car tire-pressure warning light
  - a punch-in close-up on Marcus reading the estimate
  - paper plan cards pinned to a corkboard, wrecked by a giant REPAIR BILL ("DUE NOW")
  - a glass EMERGENCY FUND jar filled with cash
- **Goal scene:** "22" becomes huge numerals behind Marcus. A tear-off wall calendar rips its 2026 page off
  on "before 2027" to reveal 2027 with a green DEBT FREE stamp. This replaces the old dashboard panel.
- **Framing:** tighter camera on the hammer moment, the blocked door, and the goal and plan scenes, so frames
  aren't empty.

## 3. Burned-in subtitles (`src/debt-story/Subtitles.tsx`)
- 30 groups of 2–6 words that follow the narration word for word.
- Timed from the measured pauses and energy dips (see `STORYBOARD.md`), and verified on the final MP4. Narration
  pauses in the export match the source within 0.02 s.
- Placed at 70–78% of frame height (y 1346–1496), Inter 800, white on a translucent dark backing, with key
  words in brand green.
- At most two lines, with balanced wrapping so there are no orphan words, and words never break
  (DEBT-FREE stays whole).
- They fade in quickly without bouncing or karaoke effects.
- All scene art was raised 210 px so nothing important sits under the subtitles. The watermark moved below them.

## 4. Pacing
- **Expense run (4.6–9.0 s):** a faint red stress pulse, per-bill punch-in zooms, and faster cuts.
- **Emergency-fund reveal (20.7–24.8 s):** deliberately slower, with a continuous jar grow, a slow push-in, and
  cash stacking in.
- **Holds and gaps:** the long hold on the static door scene is gone, and the black gap between the savings and
  ending scenes is removed.

## 5. Emergency-fund scene (24.6–31.9 s, illustrative)
1. "$500" appears as a large number (150 px) over the jar, with a $500 level marker.
2. On "$1,000" it counts up to "$1,000", the jar fills higher, a second marker appears, and a "BIGGER BUFFER" pill shows.
3. A REPAIR BILL arrives. Cash flies from the jar to the bill, the bill is stamped PAID with a green check, and
   the jar level drops (savings get used).
4. On "without reaching for a credit card", the screen splits into WITH SAVINGS (paid) and WITHOUT (the same
   bill goes onto a credit card and "DEBT GROWS").

This follows the narration's order, so the $1,000 "bigger buffer" beat comes right after $500, before the
expense arrives. There are no dollar amounts other than the narrated $500 and $1,000. The footnote
"Illustrative example. Expense costs vary." stays on screen.

## 6. Ending
- **STEP 1 "PAYING OFF DEBT":** a grey and red world where Marcus shoves the DEBT block off screen.
- **STEP 2 "STAYING OUT OF DEBT":** a green wipe into a green world. A new surprise bill is paid from his jar,
  then a "THE REAL GOAL" pill and a big check appear, and Marcus cheers.
- **Final question:** "WHAT ALWAYS BREAKS YOUR BUDGET?" as a large headline, three answer options (FLAT TIRE,
  CAR REPAIR, RANDOM BILL), and a "DROP IT IN THE COMMENTS" chip. It ends 0.7 s after the last word.

## QC performed on the exported MP4
- Probe: 1080×1920, 30 fps, 41.0 s. Loudness −14.0 LUFS, peak −1.5 dBFS, no clipping.
- One frame every 0.5 s (82 frames) checked for overlaps, clipping, empty frames and subtitle placement.
  Every transition was checked frame by frame.
- Subtitle sync: the narration's pause timestamps in the export match the source voiceover.

---

# V3 polish pass (`stack-with-gio-debt-story-v3.mp4`)

The V2 design is unchanged. Specs: 1080×1920, 30 fps, 40.8 s, −14.0 LUFS, −1.5 dB peak.

1. **Hook:** the REPAIR BILL is already in frame on frame 0 (with the flat tire and the headline) and settles
   with a small wobble. Its paper and thud sounds moved to 0.0 s.
2. **"$289":** this was not a stored figure. It was an in-between frame of the $0 → $500 count-up animation.
   The counter is gone, so only the narrated $500 and $1,000 ever appear, each shown whole on its word.
   No new balance was added.
3. **Subtitles 17% larger:** 58 → 68 px.
4. **Subtitle position:** a fixed lower-middle band centred at about 72% of frame height (y 1300–1480),
   narrowed to x 130–950 to clear the right-hand like/comment/share buttons. All scene art was raised
   230 px (from 210) so it ends above the band.
5. **Word-for-word timing:** two long groups were split at measured word boundaries so they never wrap to a
   third line at the larger size: "Because paying off debt / is one thing." (32.96 s) and
   "What's the one / unexpected expense" (37.68 s). There are now 32 groups.
6. **No overlaps:** a frame was checked mid-way through every subtitle group. None overlaps a number, card,
   jar, bill or label.
7. **$500 vs $1,000:** two jars side by side. "$500" sits over a lower-filled jar, then a fuller "$1,000"
   jar slides in beside it under a "BIGGER BUFFER" label. When the bill arrives, the $1,000 jar takes the main spot.
8. **Holds:** a slow push-in on the "with vs without savings" split, and the tail cut from 0.7 s to 0.4 s
   after the last word.
9. **Ending:** the question, the three answer options and "DROP IT IN THE COMMENTS" are unchanged and
   sit clear of the subtitles.
