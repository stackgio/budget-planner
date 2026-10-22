# Stack With Gio — "10 Years Back or $10 Million"

A vertical video (1080×1920, 30 fps, 25.0 s) made with Remotion, React, TypeScript and custom SVG artwork.

## Files
- `StackWithGio_TimeOr10Million_1080x1920.mp4`: the final video (H.264 High, yuv420p, AAC 192 kbps, faststart).
- `StackWithGio_TimeOr10Million_contact_sheet.png`: every scene, plus the frames just before and after each major transition.
- `..._contact_sheet_safe_area.png`: the same frames with the x 100–900 / y 230–1490 safe area outlined.
- `public/narration.mp3`: the supplied ElevenLabs narration, used unmodified. There is no music and there are no sound effects.
- `public/fonts/`: Inter Display (SIL OFL), loaded locally before the first frame.
- `src/timing.ts`: cue frames for every scene beat.
- `src/Video.tsx`: all nine scenes. Clock, Marcus, brain and panels carry over between scenes as continuous elements.
- `src/components/`: Marcus (posable stickman), clock, cash, calendar, brain, panels, memory frames, and fit-to-width text.
- `tools/align.py`: forced alignment of the narration to the script (pocketsphinx). Its output is `tools/timings.json`.
- `tools/contact_sheet.py`: builds the review sheets.

## Render
```bash
npm install
npx remotion render src/index.ts TimeOr10Million out/StackWithGio_TimeOr10Million_raw.mp4 --audio-bitrate=192k
ffmpeg -y -i out/StackWithGio_TimeOr10Million_raw.mp4 -c copy -movflags +faststart StackWithGio_TimeOr10Million_1080x1920.mp4
```
`remotion.config.ts` sets h264, yuv420p, CRF 12 and the browser. The browser is the preinstalled headless Chromium at
`/opt/pw-browsers/...`. You can override it with `REMOTION_BROWSER=/path/to/chrome`, or remove that line so Remotion downloads its own.
Run `npx remotion studio src/index.ts` to preview and scrub interactively.

## Re-timing
```bash
python3 -m venv .venv && .venv/bin/pip install pocketsphinx
ffmpeg -i public/narration.mp3 -ac 1 -ar 16000 -f s16le narration16k.raw
.venv/bin/python -I tools/align.py narration16k.raw > tools/timings.json
```
Then update the frame numbers in `src/timing.ts`. Each one is `round(seconds × 30)`.

## Notes
- No character reference image was supplied, so Marcus is the specified fallback: a white stickman wearing a backward black cap outlined in white.
- All animation is frame-based and deterministic. Nothing uses random values or timers.
