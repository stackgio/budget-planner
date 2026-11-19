# One Good Day — `OneGoodDay` (motivational, silent, 10 s)

One continuous shot: Pexels 19688504 (`public/motion/one-good-day/assets/street-predawn-pexels-19688504.mp4`), source 0.5–10.5 s.
The footage's forward travel plus a 100→104% scale make up the push-in. A charcoal overlay (62%→44%) and brightness (0.32→0.66) open near-black and lift after "1 good day" lands.
The type block is centred in the safe band (x 516, y 830), with the setup in Inter 700 68 px and the payoff in Inter 900 104 px. The numeral 1 is green (`cinematic.accent`).

| Time | Setup | Payoff | Motion |
|---|---|---|---|
| 0.00–1.80 | A lot can change | in **1** good year. | fully visible on frame 0; 6-frame masked exit |
| 1.80–3.50 | It can start with | **1** good season. | masked rise (9 f), payoff +3 f; masked exit |
| 3.50–5.30 | — | Or **1** good month. | masked rise; masked exit |
| 5.30–10.00 | And it all starts with | **1 good day** (green). | setup rises at 5.30, payoff at 5.60 (12 f); held to the end; the light lifts 5.6–7.4 s |

No audio of any kind. Timeline lives in `src/videos/one-good-day/script.ts` (`BEATS`).

## Render (fixed timeline, so not `scripts/motion/render.sh`, which times scenes from narration)
```
npx remotion render src/index.ts OneGoodDay renders/one-good-day/one-good-day_vNN_silent.mp4 \
  --codec=h264 --crf=16 --pixel-format=yuv420p --image-format=jpeg --jpeg-quality=95 --color-space=bt709 --muted \
  --browser-executable="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | head -1)"
```
