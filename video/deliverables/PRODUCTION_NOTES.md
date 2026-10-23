# Stack With Gio — "3 Things I REFUSE to Go Into Debt For"

**Final render:** `StackWithGio_3ThingsNoDebt_1080x1920.mp4`
1080×1920 · 9:16 · H.264 High@4.2 · yuv420p (TV range, BT.709) · 30 fps CFR · 1170 frames · 39.0 s · AAC 256 kbps 48 kHz · faststart

The voiceover is the original ElevenLabs file, unchanged in speed, pitch and content. It ends at 37.76 s, and the last 1.2 s holds the CTA. There is no music.

---

## 1. Pipeline

| Step | Tool used |
|---|---|
| Voice timing | ffmpeg `silencedetect` for pauses, plus sherpa-onnx Zipformer (offline ASR) for token timestamps. Phrase-initial words are snapped to the silence boundaries. |
| Assets | Adobe Stock **free-tier** photos, licensed through the Adobe connector (licenses are on the connected Adobe account) |
| Cutouts | `rembg` with the ISNet model, run locally. Enclosed mask holes are filled for white products. |
| Motion graphics | **Remotion 4.0.538** (React), rendered with the preinstalled headless Chromium |
| SFX | Synthesized procedurally in numpy (`tools/make_sfx.py`). No third-party samples. |
| Master | ffmpeg: full→TV range, loudnorm to −14 LUFS / −1 dBTP |

Not used: Canva image generation (it returned only a 200 px preview), Adobe cloud background removal (its output host is blocked from this environment), Higgsfield (not enough credits), and stock footage or video clips (stills plus motion design only).

## 2. Editable source

```
video/
  remotion/                 ← Remotion project (npm i; npm run studio / node render.mjs Main out/x.mp4)
    src/timing.ts           ← ALL word timings, scene windows, captions, SFX cues (edit here first)
    src/lib.ts              ← palette, fonts, easing helpers
    src/ui.tsx              ← Captions, Kicker, RevealLine, PriceTag, Glass card, grain/vignette, watermark
    src/social.tsx          ← generic (unbranded) social post + notification components
    src/scenes/S1Hook … S9CTA.tsx
    public/                 ← vo.mp3 (original), img/, cut/ (cutouts), sfx/
  assets/raw, assets/cut    ← full-res licensed stock + cutouts
  tools/                    ← ASR, cutout, mask-fill, SFX generators; raw word timestamps
  deliverables/             ← final MP4 + this file
```

The `remotion/out/` master has full-range color and is not loudness-normalized. Use `deliverables/` for upload.

## 3. Timestamped scene plan (as built)

| Time | Narration | Visual | On-screen text |
|---|---|---|---|
| 0.00–2.37 | "Three things I refuse to go into debt for." | Car, hi-top sneakers, shopping bag and watch slam in on a dark stage (car and title are on screen from frame 0). A red DEBT stamp hits at 1.92 with a shake and the objects desaturate. A green strike crosses it out at 2.10 and the stamp splits apart. | **3 THINGS** / I REFUSE TO **FINANCE** |
| 2.30–5.38 | "Number one, an expensive car." | Whip-push right. A real luxury sedan drives in from the right with motion trail, reflection and contact shadow. The payment card slides up on "car". | NUMBER ONE · **EXPENSIVE CAR.** · CAR PAYMENT $700 / MONTH |
| 5.38–9.52 | "Imagine paying seven hundred to a thousand dollars every month for a car," | Slow push-in. Amount pulses on "seven" and counts $700→$1,000 on "to a thousand". A wallet appears and monthly red chips (JAN–JUN −$850) fly into the card. | **$700–$1,000 / MONTH** · caption "Imagine paying..." |
| 9.52–13.49 | "when that money could go towards saving, traveling, or building your future." | The car drives off left. The payment card morphs into a green header, then three masked panels wipe in on the exact words: coin jar (balance counts to $10,200), real beach, first-home savings goal bar (68%). | SAVE · TRAVEL · BUILD WEALTH · "12 months × $850 set aside" · "Illustrative · contributions only, no returns assumed" |
| 13.30–16.08 | "Number two, clothes and shoes." | A shopping bag flies in and becomes a mask that opens into a boutique (object-matched transition). The rack sharpens on "clothes" and two sneakers drop in on "shoes". | NUMBER TWO · **CLOTHES & SHOES** |
| 16.08–19.73 | "That SHEIN cart, designer clothes, expensive sneakers…" | A hand holds a phone showing a generic, unbranded cart. Items add on each spoken item and the total climbs ("or 4 payments… pay later"). Paper price tags stack beside the phone. | captions: "That SHEIN cart," / "designer clothes," / "expensive sneakers..." |
| 19.73–22.94 | "Imagine literally wearing your debt. That's crazy!" | The tags fly onto a person's outfit (sweater, jacket, jeans, both shoes) on strings. On "wearing" they flip into red DEBT labels. On "debt" a big label slams in. On "That's crazy!" there's a zoom punch to the face, a red flash, a warning badge and a record scratch. | **WEARING DEBT** · ⚠ OVER BUDGET · caption "That's crazy!" |
| 22.94–26.01 | "And number three, impressing people." | Camera viewfinder (REC, focus box) on a man posing on a luxury SUV. A shutter flash on "impressing" turns it into a social post with likes counting and hearts floating. On "people" the camera pulls back and desaturates, and two bill notifications drop in. | NUMBER THREE · **IMPRESSING PEOPLE** · "Payment due tomorrow: $940" · "Balance $4,812 · 29.99% APR" |
| 26.01–30.98 | "Going broke trying to look rich, just to get approval from people who probably don't even care?" | Split screen: the post (likes rising, pulse on "approval") against an illustrative checking balance with a sparkline falling $2,430 → −$443 as debits land, then OVERDRAWN. Cut to real people scrolling their phones: the post flicks past twice and the icons fade. | **LOOKING RICH ≠ BEING RICH** · "0 new likes · scrolled past" + captions |
| 30.98–35.45 | "Nah. If I have to go into debt just to impress somebody, I've already lost." | Hard cut to black for "NAH." Then a man walks away (back to camera). A $940/mo finance offer gets "✕ NOT FOR ME" and is swiped away. A green check draws on with a chime. | **NAH.** · **MY MONEY. / MY PRIORITIES.** + captions |
| 35.45–39.00 | "What's one thing YOU refuse to go into debt for?" | The three categories return as balanced tiles (car, sneakers, the posed photo). The headline and comment pill come in, with a breathing glow and bouncing arrow through the hold. | 1 CAR · 2 CLOTHES & SHOES · 3 IMPRESSING PEOPLE · **WHAT'S YOUR #1?** · COMMENT BELOW ↓ · @stackwithgio |

Captions sit at y≈1352–1500, clear of the bottom platform UI and the right-side buttons (120 px side margins). They only appear where a scene title doesn't already carry the words. Green is used for emphasis and red for debt or negative outcomes. A subtle @stackwithgio watermark appears throughout and more prominently on the end card.

**SFX (all mixed −14 to −20 dB under the voice):** impact, whooshes, stamp, snap, car pass, counter ticks, coins, pops, cart click, warning, record scratch, shutter, notification ding, success chime. Exact cues are in `src/timing.ts → SFX`.

## 4. Asset list

All photos are Adobe Stock, free tier, licensed through the connected Adobe account. Stock asset IDs:

| Use | File | Adobe Stock ID |
|---|---|---|
| Hook car (front) | car_sedan_front | 1679211632 (3D render) |
| Luxury sedan (S2, S9, offer card) | car_highway | 723267806 |
| Hi-top sneakers | sneakers_hightop | 590431879 |
| White leather sneakers | sneakers_sport | 458288797 |
| Shopping bag (hook + mask transition) | shopping_bag | 137879615 |
| Watch | watch | 326751362 |
| Wallet | wallet | 167669545 |
| Coin jar / savings | jar | 392880626 |
| Beach | beach | 162055578 |
| Boutique clothing | boutique | 611889511 |
| Hand + phone (cart) | phone_hand | 613367215 |
| Outfit model (wearing debt) | man_fullbody | 463923453 |
| Man posing on SUV (post) | man_black_suv | 375119094 |
| Man w/ bags by sports car (split screen) | man_bags_car | 553457045 |
| People on phones | people_phones | 329968565 |
| Man walking away | man_walking_away | 472996566 |
| Dark stage floor | stage_floor | 321610006 |

These were licensed but not used: 218655099, 364713497 (key-fob cutout had mask holes), 302710422.

Fonts are Inter and Inter Display, installed locally (OFL). SFX are original synthesis.

**Illustrative-only elements:** the cart UI, social post (handle "totally.rich"), notifications and checking balance are generic mockups. They use no real brand UI or logo, and no real account data. "SHEIN" appears only in the spoken-word caption.

## 5. Render inspection summary

Checked on the final encoded MP4:

- **Specs:** 1080×1920, 30/1 fps, 1170 frames, 39.0 s; H.264 yuv420p TV range; AAC 48 kHz.
- **Opening:** frame 0 already shows "3 THINGS" and the car. All three objects are on screen by 0.6 s and "I REFUSE TO FINANCE" by 0.9 s.
- **Frozen/missing frames:** `freezedetect` (0.8 s) found none, and `blackdetect` (0.1 s) found none. During QC I found and fixed a ~0.3 s near-empty frame at 2.45 s (car entrance now starts at 2.30 s).
- **Sync:** cross-correlating the output audio against the original voiceover gives a 0 ms offset. Captions and beats are keyed to the measured word times. Expect ±40–80 ms ASR precision on words inside a phrase. Phrase starts are snapped to measured pauses.
- **Audio:** no music. Output integrated loudness is −14.0 LUFS with a −1.0 dBFS peak. The narration was −20.3 LUFS, so the master was raised about 6 dB through ffmpeg loudnorm. The voice's −3 dB peaks needed limiting, so loudnorm used its dynamic mode rather than a pure linear gain.
- **Text and numbers:** spelling checked on stills. Dollar figures are consistent: $700–$1,000/mo, $850 × 12 = $10,200, cart $64 + $289 + $120 + $220 + $180 = $873, and the balance $2,430 − 940 − 273 − 610 − 1,050 = −$443.
- **Safe areas and overlap:** titles sit between y 196 and 640, and captions between y 1352 and 1500. The cart total was clipping against the phone bezel, and the "OVER BUDGET" badge was colliding with a tag during the zoom. Both were fixed before the final render.
- **CTA:** "WHAT'S YOUR #1?" is on screen from 36.3 s and "COMMENT BELOW ↓" from 36.9 s. With the 1.2 s hold after the voice, the CTA stays readable for about 2.1 s.

**Known limitations:**
- Visuals are animated stills, not stock video. Stock video hosts weren't reachable here, and the cart and social screens are designed mockups.
- "The person looks down at the outfit" is done as a zoom punch plus warning flash, because the stock model faces the camera.
- Different stock models appear in scenes 5–8, rather than one recurring character.
