# Storyboard: "$15.52 dividend" (meme, ~14 s)

Type: funny finance meme. Narration: `script.txt` → `narration.json` (frames at 30 fps).
Current audio is a **Piper placeholder**. Swap in the ElevenLabs take and re-run alignment; every
beat below is a narration cue, so the edit re-times itself.

| Time / frames | Narration | Visual | Style choice | Cue |
|---|---|---|---|---|
| 0.0–3.2 s / 0–96 | "You open your phone, and boom. A dividend just hit." | Phone rises into a slow push-in. Notification springs down **on "boom"** with a haptic buzz and a ping. The card glows green on "dividend". | Device UI, diegetic SFX, no on-screen text beyond captions | `L1`, `word('boom')`, `word('dividend')` |
| 3.2–3.9 s / 96–116 | (pause → "Fifteen…") | Camera accelerates into the notification and blurs out; the counter emerges (zoom-through). | Match cut: the amount becomes the counter | `L1.to` → `L2.from + 8` |
| 3.5–5.7 s / 106–172 | "Fifteen dollars and fifty-two cents." | Odometer counter +$0.00 → **+$15.52, landing on "cents"** with a glow pulse. Tens digit grows in as it passes $10. | Money counter is the visual; captions stay below | `L2`, `word('cents').to` |
| 6.1–7.7 s / 182–230 | "For doing absolutely nothing." | Counter rises and shrinks to the top. Gio slides up in the lounge pose (hands behind head, smug). | Character storytelling | `L3` |
| 8.0–10.0 s / 241–300 | "So naturally, I'm retiring." | Stands on "naturally", crouches on "I'm", **jumps on "retiring"**. Sunglasses drop with a pop, bills rain, the green light swells. | Character reaction, restrained celebration | `word('naturally')`, `word("I'm")`, `word('retiring')` |
| 10.4–12.0 s / 311–359 | "Starting next quarter. Maybe." | Bills freeze and vanish, the light drops, deadpan face. Push-in to a close-up on "quarter"; the counter fades out. On "Maybe" he shrugs, the shades slide down his nose, sweat drop. | Comedic hard stop + close-up | `L5`, `word('quarter')`, `word('maybe')` |
| 12.2–14.0 s / 367–421 | — | End card: stack mark builds, "Stack With Gio", CTA, Gio waves. | Brand outro | `L5.to + 8` |

Numbers on screen: only $15.52 (the dividend in the script). The SFX are synthesized, subtle and diegetic: ping, whoosh, pop.
